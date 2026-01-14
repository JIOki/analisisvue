<script setup>
import { ProductService } from '@/service/ProductService';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

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
const material = ref({
  title: '',
  author: '',
  owner: '',
  tags: '',
  category: 'CasosUso', // puedes dejarlo fijo
  file: null
});

const loading = ref(false);
const success = ref(false);

const fileUploadRef = ref(null);


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


/*async function uploadMaterial() {
  const formData = new FormData();
  formData.append('title', material.value.title);
  formData.append('author', material.value.author);
  formData.append('owner', material.value.owner);
  formData.append('tags', material.value.tags);
  formData.append('category', material.value.category);
  formData.append('user_id', authStore.userId || authStore.user?.id);
  formData.append('file', material.value.file);

   try {
     if (!material.value.title || !material.value.file) {
       console.warn('⚠️ Título y archivo son obligatorios');
       return;
     }
     const res = await fetch('/api/material/upload', {
       method: 'POST',
       body: formData
     });
 
     if (!res.ok) throw new Error(await res.text());
     const data = await res.json();
     console.log('✅ Documento guardado con ID:', data.sourceId);
   } catch (err) {
     console.error('❌ Error al subir material:', err.message);
   }
 }*/

async function uploadMaterial() {
  if (!material.value.title || !material.value.file) return;

  loading.value = true;
  success.value = false;

  const formData = new FormData();
  formData.append('title', material.value.title);
  formData.append('author', material.value.author);
  formData.append('owner', material.value.owner);
  formData.append('tags', material.value.tags);
  formData.append('category', 'CasosUso');
  formData.append('user_id', authStore.userId || authStore.user?.id);
  formData.append('file', material.value.file);

  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/material/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    console.log('✅ Documento guardado con ID:', data.sourceId);

    success.value = true;
    setTimeout(() => {
      loading.value = false;
      resetForm();
      fetchMaterials(); // ✅ recarga la tabla
    }, 3500); // tiempo para mostrar el mensaje de éxito
  } catch (err) {
    console.error('❌ Error al subir material:', err.message);
    loading.value = false;
  }
}

function resetForm() {
  material.value = {
    title: '',
    author: '',
    owner: '',
    tags: '',
    category: 'CasosUso',
    file: null
  };
  if (fileUploadRef.value) {
    fileUploadRef.value.clear(); // ✅ limpia el nombre del archivo
  }


}


///////////////////////////////////carga de materiales 
const materials = ref([]);
const selectedMaterials = ref([]);

const materialFilters = ref({
  global: { value: '', matchMode: 'contains' }


});


/*async function fetchMaterials() {
  try {
    const res = await fetch('/api/material/list');
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    materials.value = data;
    console.log('📚 Materiales cargados:', data.length);
  } catch (err) {
    console.error('❌ Error al cargar materiales:', err.message);
  }
}*/
/*async function fetchMaterials() {
  try {
    const res = await fetch('/api/material/list');
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();

    // 🔍 Filtrar solo los que tienen categoría "MarcoTeorico"
    materials.value = data.filter(m => m.category === 'MarcoTeorico' || m.category === 'Marco Teórico' || m.category === 'Marco teórico');

    console.log('📚 Casos teóricos cargados:', materials.value.length);
  } catch (err) {
    console.error('❌ Error al cargar materiales:', err.message);
  }
}
*/
//FUNCIONA 29/09/2025
/*async function fetchMaterials() {
  try {
    const res = await fetch('/api/material/list');
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();

    const filter = materialFilters.value.global.value?.trim();
    materials.value = filter
      ? data.filter(m =>
          [m.title, m.author, m.owner, Array.isArray(m.tags) ? m.tags.join(', ') : m.tags]
            .some(field => field?.toLowerCase().includes(filter.toLowerCase()))
        )
      : data;
  } catch (err) {
    console.error('❌ Error al cargar materiales:', err.message);
  }
}
*/


async function fetchMaterials() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/material/list', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ Error del servidor:', res.status, errorText);
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }
    
    const data = await res.json();

    // 🔍 Filtrar solo los que tienen categoría 1 (Marco Teórico)
    const marcoTeorico = data.filter(m => m.category === "CasosUso" || m.category === "CasoUso" );
    console.log('📚 Casos de uso cargados:', marcoTeorico.length) ;

    // 🔍 Aplicar filtro global si existe
    const filter = materialFilters.value.global.value?.trim().toLowerCase();
    materials.value = filter
      ? marcoTeorico.filter(m =>
        [m.title, m.author, m.owner, Array.isArray(m.tags) ? m.tags.join(', ') : m.tags]
          .some(field => field?.toLowerCase().includes(filter))
      )
      : marcoTeorico;
  } catch (err) {
    console.error('❌ Error al cargar materiales:', err.message);
  }
}


onMounted(() => {
  fetchMaterials();
});


//////////////////////////funcion de edicion
const loadingEdit = ref(false);
const successEdit = ref(false);
// para validación opcional

const editingMaterial = ref(null);
const showEditDialog = ref(false);


function editMaterial(material) {
  editingMaterial.value = { ...material }; // copia segura
  showEditDialog.value = true;
}


async function saveMaterialEdit() {
  submitted.value = true;

  if (!editingMaterial.value.title?.trim()) return;

  loadingEdit.value = true;
  successEdit.value = false;

  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/material/update/${editingMaterial.value.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(editingMaterial.value)
    });

    if (!res.ok) throw new Error(await res.text());

    successEdit.value = true;

    setTimeout(() => {
      loadingEdit.value = false;
      showEditDialog.value = false;
      editingMaterial.value = null;
      fetchMaterials(); // ✅ refresca la tabla
      submitted.value = false;
    }, 3000); // ⏱️ spinner + mensaje de éxito
  } catch (err) {
    console.error('❌ Error al actualizar material:', err.message);
    loadingEdit.value = false;
  }
}

watch(() => materialFilters.value.global.value, (newValue) => {
  if (newValue?.trim()) {
    localStorage.setItem('materialFilterGlobal', newValue);
  } else {
    localStorage.removeItem('materialFilterGlobal');
  }
});

onMounted(() => {
  const savedFilter = localStorage.getItem('materialFilterGlobal'); // 👈 misma clave
  if (savedFilter) {
    materialFilters.value.global.value = savedFilter;
  }
  fetchMaterials();
});


const loadingProgress = ref(false);

function seleccionarMarcoTeorico() {
  const ids = selectedMaterials.value.map(m => m.source_id || m.id);
  if (ids.length === 0) {
    console.warn('⚠️ No hay documentos seleccionados');
    return;
  }

  loadingProgress.value = true; // ✅ activa la barra

  localStorage.setItem('casosUsoIds', JSON.stringify(ids));

  // ⏳ espera 3 segundos antes de redirigir
  setTimeout(() => {
    loadingProgress.value = false;
    router.push({ name: 'chatinteligente' });
  }, 3000);
}


</script>

<template #list="slotProps">

  <div class="flex flex-col">
    <div class=" card  mr-4">
      <h1>Carga de Casos de uso</h1>
      <Toolbar class="mb-4">
        <template #start>
          <Button label="Nuevo material" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
          <!--Button label="Eliminar" icon="pi pi-trash" severity="secondary" @click="confirmDeleteSelected" :disabled="!selectedMaterials || !selectedMaterials.length" /-->
        </template>
      </Toolbar>
      <Toolbar class="mb-6">
        <template #start>
          <Button label="Seleccionar caso de uso" icon="pi pi-check" severity="secondary"
            class="mr-2"  @click="seleccionarMarcoTeorico"
            :disabled="!selectedMaterials || !selectedMaterials.length" />
        </template>
      </Toolbar>
      <DataTable ref="dt" v-model:selection="selectedMaterials" :value="materials" dataKey="id" :paginator="true"
        :rows="10" :filters="materialFilters" :globalFilterFields="['title', 'author', 'owner', 'tags']"
        :rowsPerPageOptions="[5, 10, 25]"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} materiales">

        <template #header>
          <div class="flex flex-wrap gap-2 items-center justify-between">
            <h4 class="m-0">Biblioteca Caso de Uso</h4>
            <IconField>
              <InputIcon><i class="pi pi-search" /></InputIcon>
              <InputText v-model="materialFilters.global.value" @input="fetchMaterials" placeholder="Buscar..." />
            </IconField>
          </div>
        </template>

        <Column selectionMode="multiple" style="width: 3rem" :exportable="false" />
        <Column field="title" header="Título" sortable />
        <Column field="author" header="Autor" sortable />
        <Column field="owner" header="Propietario" sortable />
        <Column field="tags" header="Etiquetas" sortable>
          <template #body="slotProps">
            {{ Array.isArray(slotProps.data.tags) ? slotProps.data.tags.join(', ') : slotProps.data.tags }}
          </template>

        </Column>
        <Column field="rating" header="Reviews" sortable>
          <template #body="slotProps">
            <Rating :modelValue="slotProps.data.rating" readonly />
          </template>
        </Column>
        <Column field="category" header="Tipo">
          <template #body="{ data }">
            {{ data.category === 'MarcoTeorico' ? 'Marco Teórico' : 'Caso de Uso' }}
          </template>
        </Column>


        <Column :exportable="false" style="min-width: 12rem">
          <template #body="slotProps">
            <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editMaterial(slotProps.data)" />
            <!--Button icon="pi pi-trash" outlined rounded severity="danger"
              @click="confirmDeleteMaterial(slotProps.data)" /-->
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Diálogo para crear/editar material -->
    <Dialog v-model:visible="materialDialog" :style="{ width: '800px' }" header="Nuevo material teórico" :modal="true"
      class="w-full md:w-[600px]">
      <div class="flex flex-col gap-6">
        <div>
          <label for="title" class="block font-bold mb-3">Título</label>
          <InputText id="title" v-model.trim="material.title" required autofocus :invalid="submitted && !material.title"
            class="w-full md:w-[600px]" />
          <small v-if="submitted && !material.title" class="text-red-500">El título es obligatorio.</small>
        </div>

        <div>
          <label for="author" class="block font-bold mb-3">Autor</label>
          <InputText id="author" v-model="material.author" class="w-full md:w-[600px]" />
        </div>

        <div>
          <label for="owner" class="block font-bold mb-3">Propietario</label>
          <InputText id="owner" v-model="material.owner" class="w-full md:w-[600px]" />
        </div>

        <div>
          <label for="tags" class="block font-bold mb-3">Etiquetas</label>
          <InputText id="tags" v-model="material.tags" placeholder="teoría, fundamentos, educación"
            class="w-full md:w-[600px]" />
        </div>

        <div>
          <label for="file" class="block font-bold mb-3">Seleccionar archivo</label>
          <FileUpload ref="fileUploadRef" mode="basic" name="file" accept=".pdf,.doc,.docx,.txt" customUpload
            :auto="false" @select="(e) => material.file = e.files?.[0] || null" chooseLabel="Seleccionar archivo"
            class="w-full md:w-96" />
        </div>

        <!--div class="flex justify-end">
      <Button label="Cargar documento" icon="pi pi-upload" severity="info" @click="uploadFile" :disabled="!material.file" />
    </div-->
      </div>

      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text @click="hideDialog" />
        <Button label="Guardar" icon="pi pi-check" @click="uploadMaterial" />
      </template>

      <Dialog v-model:visible="loading" header="Procesando documento…" :modal="true" :closable="false"
        :transitionOptions="{ duration: 300 }">
        <div class="flex flex-col items-center gap-4">
          <ProgressSpinner />
          <span v-if="!success">Guardando en la base de datos…</span>
          <span v-else class="text-green-600 font-semibold">✅ Proceso completado</span>
        </div>
      </Dialog>

    </Dialog>
  </div>


  <!-- 
   
   
   -->

  <Dialog v-model:visible="showEditDialog" :style="{ width: '800px' }" header="Editar material teórico" :modal="true"
    class="w-full md:w-[600px]">
    <div class="flex flex-col gap-6">
      <div>
        <label for="title" class="block font-bold mb-3">Título</label>
        <InputText id="title" v-model.trim="editingMaterial.title" required autofocus
          :invalid="submitted && !editingMaterial.title" class="w-full md:w-[600px]" />
        <small v-if="submitted && !editingMaterial.title" class="text-red-500">El título es obligatorio.</small>
      </div>

      <div>
        <label for="author" class="block font-bold mb-3">Autor</label>
        <InputText id="author" v-model="editingMaterial.author" class="w-full md:w-[600px]" />
      </div>

      <div>
        <label for="tags" class="block font-bold mb-3">Etiquetas</label>
        <InputText id="tags" v-model="editingMaterial.tags" placeholder="teoría, fundamentos, educación"
          class="w-full md:w-[600px]" />
      </div>
    </div>

    <template #footer>
      <Button label="Cancelar" icon="pi pi-times" text @click="showEditDialog = false" />
      <Button label="Guardar cambios" icon="pi pi-check" @click="saveMaterialEdit" />
    </template>
  </Dialog>

  <Dialog v-model:visible="loadingEdit" header="Guardando cambios…" :modal="true" :closable="false"
    :transitionOptions="{ duration: 300 }">
    <div class="flex flex-col items-center gap-4">
      <ProgressSpinner />
      <span v-if="!successEdit">Actualizando en la base de datos…</span>
      <span v-else class="text-green-600 font-semibold">✅ Cambios guardados</span>
    </div>
  </Dialog>

 <Dialog v-model:visible="loadingProgress" header="Guardando material…" :modal="true" :closable="false"
    :transitionOptions="{ duration: 300 }">
    <div class="flex flex-col items-center gap-4">
      <ProgressSpinner />
      <span v-if="!loadingProgress">Guardando material…</span>
      <span v-else class="text-green-600 font-semibold">✅ Material guardado</span>
    </div>
  </Dialog>
  


</template>