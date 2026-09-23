<script setup lang="ts">
import { computed } from 'vue'
import type { CatalogEntry } from '@shared/catalog'

const props = defineProps<{
  catalog: CatalogEntry[]
  query: string
}>()

const emit = defineEmits<{
  add: [type: string]
  'update:query': [value: string]
}>()

const grouped = computed(() => {
  const q = props.query.trim().toLowerCase()
  const map = new Map<string, CatalogEntry[]>()
  for (const n of props.catalog) {
    if (n.type === 'flow.main') continue
    if (q && !`${n.title} ${n.type} ${n.category}`.toLowerCase().includes(q)) continue
    const list = map.get(n.category) ?? []
    list.push(n)
    map.set(n.category, list)
  }
  return [...map.entries()]
})

function onDragStart(e: DragEvent, type: string) {
  e.dataTransfer?.setData('application/navora-flow-node', type)
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy'
}
</script>

<template>
  <aside class="palette">
    <div class="palette-head">
      <h2>节点</h2>
      <input
        :value="query"
        placeholder="搜索…"
        @input="emit('update:query', ($event.target as HTMLInputElement).value)"
      />
    </div>
    <div class="groups">
      <section v-for="[cat, items] in grouped" :key="cat">
        <h3>{{ cat }}</h3>
        <button
          v-for="n in items"
          :key="n.type"
          type="button"
          draggable="true"
          @dragstart="onDragStart($event, n.type)"
          @click="emit('add', n.type)"
        >
          <strong>{{ n.title }}</strong>
          <span>{{ n.type }}</span>
        </button>
      </section>
    </div>
  </aside>
</template>

<style scoped>
.palette {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: #fff;
  border-right: 1px solid var(--border);
}
.palette-head {
  padding: 12px;
  border-bottom: 1px solid var(--border);
}
.palette-head h2 {
  margin: 0 0 8px;
  font-size: 13px;
}
.palette-head input {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 7px 10px;
  font: inherit;
}
.groups {
  overflow: auto;
  padding: 8px;
}
section {
  margin-bottom: 12px;
}
h3 {
  margin: 0 0 6px;
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
button {
  width: 100%;
  text-align: left;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 2px;
}
button:hover {
  background: var(--accent-soft);
  border-color: #cfe8df;
}
button strong {
  font-size: 12px;
}
button span {
  font-size: 10px;
  color: var(--muted);
}
</style>
