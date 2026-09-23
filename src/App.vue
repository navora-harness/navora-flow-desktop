<script setup lang="ts">
import { ref } from 'vue'
import FlowCanvas from './components/FlowCanvas.vue'
import type { NodeSnapshot } from 'navora-flow-library-sdk'

const status = ref('就绪')
const lastSnapshots = ref<NodeSnapshot[]>([])
const selectedId = ref<string | null>(null)

const selectedSnap = () =>
  lastSnapshots.value.find((s) => s.nodeId === selectedId.value) ?? null

function onRunResult(payload: { ok: boolean; error?: string; snapshots: NodeSnapshot[]; trace: string[] }) {
  lastSnapshots.value = payload.snapshots
  status.value = payload.ok
    ? `运行成功：${payload.trace.join(' → ')}`
    : `失败：${payload.error ?? 'unknown'}`
}
</script>

<template>
  <div class="shell">
    <header class="top">
      <div class="brand">
        <span class="mark">NF</span>
        <div>
          <h1>Navora Flow</h1>
          <p>可视化流程执行器 · 脚手架</p>
        </div>
      </div>
      <div class="status">{{ status }}</div>
    </header>

    <div class="body">
      <aside class="side">
        <h2>检视</h2>
        <p class="hint">运行后点选节点查看上次 IO（Debug MVP）</p>
        <ul class="snap-list">
          <li
            v-for="s in lastSnapshots"
            :key="s.nodeId"
            :class="{ active: selectedId === s.nodeId }"
            @click="selectedId = s.nodeId"
          >
            <strong>{{ s.nodeId }}</strong>
            <span>{{ s.nodeType }}</span>
          </li>
        </ul>
        <pre v-if="selectedSnap()" class="io">{{ JSON.stringify(selectedSnap(), null, 2) }}</pre>
      </aside>
      <main class="main">
        <FlowCanvas @run-result="onRunResult" @select-node="selectedId = $event" />
      </main>
    </div>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--panel);
  border-bottom: 1px solid var(--border);
}
.brand {
  display: flex;
  gap: 12px;
  align-items: center;
}
.mark {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: var(--accent);
  color: #fff;
  font-weight: 700;
}
h1 {
  margin: 0;
  font-size: 18px;
}
.brand p {
  margin: 2px 0 0;
  color: var(--muted);
  font-size: 12px;
}
.status {
  color: var(--muted);
  font-size: 13px;
}
.body {
  flex: 1;
  display: grid;
  grid-template-columns: 280px 1fr;
  min-height: 0;
}
.side {
  background: var(--panel);
  border-right: 1px solid var(--border);
  padding: 12px;
  overflow: auto;
}
.side h2 {
  margin: 0 0 4px;
  font-size: 14px;
}
.hint {
  margin: 0 0 12px;
  color: var(--muted);
  font-size: 12px;
}
.snap-list {
  list-style: none;
  padding: 0;
  margin: 0 0 12px;
}
.snap-list li {
  padding: 8px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  cursor: pointer;
}
.snap-list li:hover,
.snap-list li.active {
  background: var(--accent-soft);
}
.snap-list span {
  color: var(--muted);
  font-size: 12px;
}
.io {
  background: #0f1720;
  color: #d7e2ec;
  padding: 10px;
  border-radius: 8px;
  font-size: 11px;
  overflow: auto;
  max-height: 40vh;
}
.main {
  min-width: 0;
  min-height: 0;
}
</style>
