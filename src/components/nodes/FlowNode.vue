<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { EditorNodeData } from '@shared/graph-model'
import { lookupType } from '@shared/graph-model'

const props = defineProps<{
  id: string
  data: EditorNodeData
  selected?: boolean
}>()

const decl = computed(() => lookupType(props.data.type))
</script>

<template>
  <div class="node" :class="{ selected, entry: data.type === 'flow.main', exit: data.type === 'flow.exit' }">
    <div class="head">
      <span class="title">{{ data.title }}</span>
      <span class="type">{{ data.type }}</span>
    </div>

    <Handle
      v-if="(decl?.exec.in ?? 0) > 0"
      id="exec:in"
      type="target"
      :position="Position.Left"
      class="h exec"
      :style="{ top: '28px' }"
    />

    <Handle
      v-for="(out, i) in decl?.exec.out ?? []"
      :id="`exec:out:${out}`"
      :key="`exec-out-${out}`"
      type="source"
      :position="Position.Right"
      class="h exec"
      :style="{ top: `${28 + i * 18}px` }"
    />

    <div class="ports">
      <div v-for="inp in decl?.inputs ?? []" :key="`in-${inp.id}`" class="port in">
        <Handle
          :id="`data:in:${inp.id}`"
          type="target"
          :position="Position.Left"
          class="h data"
        />
        <span>{{ inp.id }}</span>
      </div>
      <div v-for="out in decl?.outputs ?? []" :key="`out-${out.id}`" class="port out">
        <span>{{ out.id }}</span>
        <Handle
          :id="`data:out:${out.id}`"
          type="source"
          :position="Position.Right"
          class="h data"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.node {
  min-width: 160px;
  background: #fff;
  border: 1px solid #c9d3de;
  border-radius: 10px;
  box-shadow: 0 1px 2px rgb(16 24 40 / 6%);
  font-size: 12px;
}
.node.selected {
  border-color: #0f6e56;
  box-shadow: 0 0 0 2px rgb(15 110 86 / 20%);
}
.node.entry {
  border-color: #0f6e56;
}
.node.exit {
  border-color: #8a4b2c;
}
.head {
  padding: 8px 10px 6px;
  border-bottom: 1px solid #e8eef4;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.title {
  font-weight: 600;
  color: #1a2332;
}
.type {
  color: #6b7c8f;
  font-size: 10px;
}
.ports {
  padding: 8px 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.port {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #3b4a5a;
  position: relative;
  min-height: 16px;
}
.port.in {
  justify-content: flex-start;
  padding-left: 8px;
}
.port.out {
  justify-content: flex-end;
  padding-right: 8px;
}
.h {
  width: 10px !important;
  height: 10px !important;
  border: 2px solid #fff !important;
}
.h.exec {
  background: #0f6e56 !important;
}
.h.data {
  background: #3b6ea5 !important;
  border-radius: 2px !important;
}
</style>
