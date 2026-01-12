<script setup>
import { ProductService } from '@/service/ProductService';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

// FilterMatchMode para PrimeVue 4.x
const FilterMatchMode = {
    CONTAINS: 'CONTAINS',
    STARTS_WITH: 'STARTS_WITH',
    ENDS_WITH: 'ENDS_WITH',
    EQUALS: 'EQUALS',
    NOT_EQUALS: 'NOT_EQUALS',
    IN: 'IN',
    LESS_THAN: 'LESS_THAN',
    LESS_THAN_OR_EQUAL_TO: 'LESS_THAN_OR_EQUAL_TO',
    GREATER_THAN: 'GREATER_THAN',
    GREATER_THAN_OR_EQUAL_TO: 'GREATER_THAN_OR_EQUAL_TO',
    BETWEEN: 'BETWEEN',
    IS: 'IS',
    IS_NOT: 'IS_NOT',
    BEFORE: 'BEFORE',
    AFTER: 'AFTER',
    DATE_IS: 'DATE_IS',
    DATE_IS_NOT: 'DATE_IS_NOT',
    DATE_BEFORE: 'DATE_BEFORE',
    DATE_AFTER: 'DATE_AFTER'
};

onMounted(() => {
    ProductService.getProducts().then((data) => (products.value = data));
});

const toast = useToast();
const dt = ref();
const products = ref();
const productDialog = ref(false);
const deleteProductDialog = ref(false);
const deleteProductsDialog = ref(false);
const product = ref({});
const selectedProducts = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const submitted = ref(false);
const statuses = ref([
    { label: 'INSTOCK', value: 'instock' },
    { label: 'LOWSTOCK', value: 'lowstock' },
    { label: 'OUTOFSTOCK', value: 'outofstock' }
]);



function formatCurrency(value) {
    if (value) return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    return;
}





function saveProduct() {
    submitted.value = true;

    if (product?.value.name?.trim()) {
        if (product.value.id) {
            product.value.inventoryStatus = product.value.inventoryStatus.value ? product.value.inventoryStatus.value : product.value.inventoryStatus;
            products.value[findIndexById(product.value.id)] = product.value;
            toast.add({ severity: 'success', summary: 'Successful', detail: 'Product Updated', life: 3000 });
        } else {
            product.value.id = createId();
            product.value.code = createId();
            product.value.image = 'product-placeholder.svg';
            product.value.inventoryStatus = product.value.inventoryStatus ? product.value.inventoryStatus.value : 'INSTOCK';
            products.value.push(product.value);
            toast.add({ severity: 'success', summary: 'Successful', detail: 'Product Created', life: 3000 });
        }

        productDialog.value = false;
        product.value = {};
    }
}

function editProduct(prod) {
    product.value = { ...prod };
    productDialog.value = true;
}

function confirmDeleteProduct(prod) {
    product.value = prod;
    deleteProductDialog.value = true;
}

function deleteProduct() {
    products.value = products.value.filter((val) => val.id !== product.value.id);
    deleteProductDialog.value = false;
    product.value = {};
    toast.add({ severity: 'success', summary: 'Successful', detail: 'Product Deleted', life: 3000 });
}

function findIndexById(id) {
    let index = -1;
    for (let i = 0; i < products.value.length; i++) {
        if (products.value[i].id === id) {
            index = i;
            break;
        }
    }

    return index;
}

function createId() {
    let id = '';
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < 5; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

function exportCSV() {
    dt.value.exportCSV();
}

function confirmDeleteSelected() {
    deleteProductsDialog.value = true;
}

function deleteSelectedProducts() {
    products.value = products.value.filter((val) => !selectedProducts.value.includes(val));
    deleteProductsDialog.value = false;
    selectedProducts.value = null;
    toast.add({ severity: 'success', summary: 'Successful', detail: 'Products Deleted', life: 3000 });
}

function getStatusLabel(status) {
    switch (status) {
        case 'INSTOCK':
            return 'success';

        case 'LOWSTOCK':
            return 'warn';

        case 'OUTOFSTOCK':
            return 'danger';

        default:
            return null;
    }
}


const materialDialog = ref(false);
const material = ref({});


function openNew() {
  material.value = {};
  submitted.value = false;
  materialDialog.value = true;
}

function hideDialog() {
  materialDialog.value = false;
  submitted.value = false;
}

function saveMaterial() {
  submitted.value = true;

  if (material.value.title?.trim()) {
    // Aquí iría la lógica para guardar en backend
    console.log('✅ Material guardado:', material.value);
    materialDialog.value = false;
    material.value = {};
  }
}

</script>

<template >
 
  <div >   
    <div class=" card  mr-4" >
      <h1>Biblioteca de Resultados</h1>
     
      <Toolbar class="mb-6">
        <template #start>
          <Button label="Descargar" icon="pi pi-download" severity="secondary" class="mr-4"  />
        </template>
      </Toolbar>
      <DataTable
        ref="dt"
        v-model:selection="selectedMaterials"
        :value="materials"
        dataKey="id"
        :paginator="true"
        :rows="10"
        :filters="filters"
        :rowsPerPageOptions="[5, 10, 25]"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} materiales"
      >
        <template #header>
          <div class="flex flex-wrap gap-2 items-center justify-between">
            <h4 class="m-0">Biblioteca Teórica</h4>
            <IconField>
              <InputIcon><i class="pi pi-search" /></InputIcon>
              <InputText v-model="filters['global'].value" placeholder="Buscar..." />
            </IconField>
          </div>
        </template>

        <Column selectionMode="multiple" style="width: 3rem" :exportable="false" />
        <Column field="title" header="Título" sortable />
        <Column field="author" header="Autor" sortable />
        <Column field="owner" header="Propietario" sortable />
        <Column field="tags" header="Etiquetas" sortable />
        <Column field="rating" header="Reviews" sortable>
          <template #body="slotProps">
            <Rating :modelValue="slotProps.data.rating" readonly />
          </template>
        </Column>
        <Column :exportable="false" style="min-width: 12rem">
          <template #body="slotProps">
            <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editMaterial(slotProps.data)" />
            <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteMaterial(slotProps.data)" />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Diálogo para crear/editar material -->
    <Dialog v-model:visible="materialDialog" :style="{ width: '800px' }" header="Nuevo material teórico" :modal="true"  class="w-full md:w-[600px]" 
>
  <div class="flex flex-col gap-6">
    <div>
      <label for="title" class="block font-bold mb-3">Título</label>
      <InputText id="title" v-model.trim="material.title" required autofocus :invalid="submitted && !material.title" class="w-full md:w-[600px]"  />
      <small v-if="submitted && !material.title" class="text-red-500">El título es obligatorio.</small>
    </div>

    <div>
      <label for="author" class="block font-bold mb-3">Autor</label>
      <InputText id="author" v-model="material.author" class="w-full md:w-[600px]"  />
    </div>

    <div>
      <label for="owner" class="block font-bold mb-3">Propietario</label>
      <InputText id="owner" v-model="material.owner" class="w-full md:w-[600px]"  />
    </div>

    <div>
      <label for="tags" class="block font-bold mb-3">Etiquetas</label>
      <InputText id="tags" v-model="material.tags" placeholder="teoría, fundamentos, educación" class="w-full md:w-[600px]"  />
    </div>

    <div>
      <label for="file" class="block font-bold mb-3">Seleccionar archivo</label>
      <FileUpload
        mode="basic"
        name="file"
        accept=".pdf,.doc,.docx,.txt"
        customUpload
        :auto="false"
        @select="(e) => material.file = e.files?.[0] || null"
        chooseLabel="Seleccionar archivo"
        class="w-full md:w-96" 
      />
    </div>

    <!--div class="flex justify-end">
      <Button label="Cargar documento" icon="pi pi-upload" severity="info" @click="uploadFile" :disabled="!material.file" />
    </div-->
  </div>

  <template #footer>
    <Button label="Cancelar" icon="pi pi-times" text @click="hideDialog" />
    <Button label="Guardar" icon="pi pi-check" @click="saveMaterial" />
  </template>
</Dialog>
  </div>
</template>