import { computed, ref, shallowRef, type Ref } from 'vue'

export function usePausable<T extends { id: string }>(source: Ref<T[]>) {
  const paused = ref(false)
  const frozen = shallowRef<T[]>([])

  const displayed = computed(() => (paused.value ? frozen.value : source.value))

  // Nombre de logs arrivés depuis la pause (la liste est du plus récent au plus ancien)
  const missed = computed(() => {
    if (!paused.value) return 0
    const newest = frozen.value[0]?.id
    if (!newest) return source.value.length
    const index = source.value.findIndex((log) => log.id === newest)
    return index === -1 ? source.value.length : index // -1 : le plafond l'a déjà évincé
  })

  function toggle() {
    if (!paused.value) frozen.value = source.value
    paused.value = !paused.value
  }

  return { displayed, paused, missed, toggle }
}
