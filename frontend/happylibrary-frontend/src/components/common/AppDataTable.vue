<template>
  <div class="card">
    <div class="overflow-x-auto">
      <table class="w-full table-auto">
        <thead>
          <tr class="border-b border-gray-200">
            <th
              v-for="column in columns"
              :key="column.key"
              class="px-4 py-3 text-left text-sm font-semibold text-gray-600"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in data"
            :key="row.id"
            class="border-b border-gray-200 hover:bg-gray-50"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              class="px-4 py-3 text-sm text-gray-700"
            >
              {{ row[column.key] }}
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="data.length === 0" class="py-8 text-center text-gray-500">
        Không có dữ liệu
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  columns: {
    type: Array,
    required: true,
  },
  data: {
    type: Array,
    default: () => [],
  },
});
</script>

<style scoped>
/* Component-specific styles */
</style>
