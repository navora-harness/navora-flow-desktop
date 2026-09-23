<script setup lang="ts">
import { computed } from 'vue'
import type { NodeSnapshot } from 'navora-flow-library-sdk'
import type { EditorNodeData } from '@shared/graph-model'
import { lookupType } from '@shared/graph-model'

const props = defineProps<{
  selectedId: string | null
  selectedData: EditorNodeData | null
  snapshot: NodeSnapshot | null
  status: string
  bridgeUrl: string | null
}>()

const emit = defineEmits<{
  'update:prop': [key: string, value: unknown]
}>()

const decl = computed(() => (props.selectedData ? lookupType(props.selectedData.type) : null))

const propEntries = computed(() => {
  const schema = decl.value?.props as
    | { properties?: Record<string, { type?: string; default?: unknown }> }
    | undefined
  return Object.entries(schema?.properties ?? {})
})
</script>

<template>
  <aside class="inspector">
    <div class="block">
      <h2>检视</h2>
      <p class="hint">{{ status }}</p>
      <p v-if="bridgeUrl" class="bridge">Bridge {{ bridgeUrl }}</p>
    </div>

    <div v-if="selectedData" class="block">
      <h3>{{ selectedData.title }}</h3>
      <p class="mono">{{ selectedId }} · {{ selectedData.type }}</p>

      <template v-if="propEntries.length">
        <h4>属性</h4>
        <label v-for="[key, schema] in propEntries" :key="key" class="field">
          <span>{{ key }}</span>
          <input
            v-if="schema.type !== 'boolean'"
            :value="String(selectedData.props[key] ?? schema.default ?? '')"
            @change="emit('update:prop', key, ($event.target as HTMLInputElement).value)"
          />
          <input
            v-else
            type="checkbox"
            :checked="Boolean(selectedData.props[key] ?? schema.default)"
            @change="emit('update:prop', key, ($event.target as HTMLInputElement).checked)"
          />
        </label>
      </template>
      <p v-else class="hint">此节点无属性</p>
    </div>
    <div v-else class="block hint">选中节点以编辑属性</div>

    <div v-if="snapshot" class="block">
      <h4>上次 IO</h4>
      <pre>{{ JSON.stringify({ inputs: snapshot.inputs, outputs: snapshot.outputs, error: snapshot.error }, null, 2) }}</pre>
    </div>
  </aside>
</template>

<style scoped>
.inspector {
  background: #fff;
  border-left: 1px solid var(--border);
  overflow: auto;
  min-height: 0;
}
.block {
  padding: 12px;
  border-bottom: 1px solid var(--border);
}
h2,
h3,
h4 {
  margin: 0 0 6px;
  font-size: 13px;
}
h4 {
  margin-top: 10px;
  color: var(--muted);
  font-size: 11px;
  text-transform: uppercase;
}
.hint {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
}
.bridge {
  margin: 8px 0 0;
  font-size: 11px;
  color: #0f6e56;
  word-break: break-all;
}
.mono {
  font-size: 11px;
  color: var(--muted);
  margin: 0 0 8px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
  font-size: 12px;
}
.field input[type='text'],
.field input:not([type]) {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 7px 9px;
  font: inherit;
}
pre {
  margin: 0;
  background: #0f1720;
  color: #d7e2ec;
  padding: 10px;
  border-radius: 8px;
  font-size: 11px;
  overflow: auto;
  max-height: 280px;
}
</style>
