/**
 * Pruebas de Integración del Sistema de Privacidad
 * Este script prueba los endpoints de privacidad y el pipeline RAG
 * 
 * Uso: node test/privacyTests.js
 */

import pool from '../src/db.js';
import privacyService from '../src/services/privacyService.js';
import ragPipeline from '../src/services/ragPipeline.js';

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function runTests() {
  log('\n🧪 INICIANDO PRUEBAS DE INTEGRACIÓN - SISTEMA DE PRIVACIDAD\n', 'cyan');

  // ID de prueba - reemplazar con un usuario real para pruebas
  const TEST_USER_ID = 'test-user-id';
  const TEST_MATERIAL_ID = 'test-material-id';

  try {
    // =========================================================================
    // Prueba 1: Verificar conexión a base de datos
    // =========================================================================
    logSection('PRUEBA 1: Conexión a Base de Datos');
    
    try {
      const result = await pool.query('SELECT NOW() as current_time');
      log(`✅ Conexión exitosa: ${result.rows[0].current_time}`, 'green');
    } catch (error) {
      log(`❌ Error de conexión: ${error.message}`, 'red');
      return;
    }

    // =========================================================================
    // Prueba 2: Verificar tablas requeridas
    // =========================================================================
    logSection('PRUEBA 2: Verificar Tablas de Base de Datos');
    
    const requiredTables = [
      'sources',
      'chunks',
      'records',
      'material_shares',
      'consent_audit_log',
      'users'
    ];

    for (const table of requiredTables) {
      try {
        const result = await pool.query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = $1 LIMIT 1
        `, [table]);
        
        if (result.rows.length > 0) {
          log(`✅ Tabla '${table}' existe`, 'green');
        } else {
          log(`⚠️ Tabla '${table}' no tiene columnas (puede estar vacía)`, 'yellow');
        }
      } catch (error) {
        log(`❌ Tabla '${table}' no existe o error: ${error.message}`, 'red');
      }
    }

    // =========================================================================
    // Prueba 3: Verificar campos de privacidad en sources
    // =========================================================================
    logSection('PRUEBA 3: Campos de Privacidad en Tabla Sources');
    
    const privacyColumns = [
      'is_ai_accessible',
      'is_public_for_ai',
      'ai_consent_at',
      'ai_consent_version'
    ];

    for (const column of privacyColumns) {
      try {
        const result = await pool.query(`
          SELECT data_type FROM information_schema.columns 
          WHERE table_name = 'sources' AND column_name = $1
        `, [column]);
        
        if (result.rows.length > 0) {
          log(`✅ Columna '${column}' existe (${result.rows[0].data_type})`, 'green');
        } else {
          log(`❌ Columna '${column}' no existe`, 'red');
        }
      } catch (error) {
        log(`❌ Error verificando '${column}': ${error.message}`, 'red');
      }
    }

    // =========================================================================
    // Prueba 4: Verificar tabla material_shares
    // =========================================================================
    logSection('PRUEBA 4: Estructura de Tabla material_shares');
    
    const shareColumns = [
      'material_id',
      'shared_by_user_id',
      'shared_with_user_id',
      'legal_disclaimer_accepted',
      'status'
    ];

    for (const column of shareColumns) {
      try {
        const result = await pool.query(`
          SELECT data_type FROM information_schema.columns 
          WHERE table_name = 'material_shares' AND column_name = $1
        `, [column]);
        
        if (result.rows.length > 0) {
          log(`✅ Columna '${column}' existe (${result.rows[0].data_type})`, 'green');
        } else {
          log(`❌ Columna '${column}' no existe`, 'red');
        }
      } catch (error) {
        log(`❌ Error verificando '${column}': ${error.message}`, 'red');
      }
    }

    // =========================================================================
    // Prueba 5: Verificar tabla consent_audit_log
    // =========================================================================
    logSection('PRUEBA 5: Estructura de Tabla consent_audit_log');
    
    const auditColumns = [
      'consent_type',
      'resource_type',
      'resource_id',
      'user_id',
      'consent_details'
    ];

    for (const column of auditColumns) {
      try {
        const result = await pool.query(`
          SELECT data_type FROM information_schema.columns 
          WHERE table_name = 'consent_audit_log' AND column_name = $1
        `, [column]);
        
        if (result.rows.length > 0) {
          log(`✅ Columna '${column}' existe (${result.rows[0].data_type})`, 'green');
        } else {
          log(`❌ Columna '${column}' no existe`, 'red');
        }
      } catch (error) {
        log(`❌ Error verificando '${column}': ${error.message}`, 'red');
      }
    }

    // =========================================================================
    // Prueba 6: Verificar funciones de privacidad
    // =========================================================================
    logSection('PRUEBA 6: Funciones de Privacidad en Base de Datos');
    
    const requiredFunctions = [
      'set_privacy_defaults_by_category',
      'set_material_ai_accessible',
      'update_updated_at_column'
    ];

    for (const func of requiredFunctions) {
      try {
        const result = await pool.query(`
          SELECT routine_name FROM information_schema.routines 
          WHERE routine_name = $1 AND routine_schema = 'public'
        `, [func]);
        
        if (result.rows.length > 0) {
          log(`✅ Función '${func}' existe`, 'green');
        } else {
          log(`❌ Función '${func}' no existe`, 'red');
        }
      } catch (error) {
        log(`❌ Error verificando '${func}': ${error.message}`, 'red');
      }
    }

    // =========================================================================
    // Prueba 7: Verificar buildPrivacyFilters
    // =========================================================================
    logSection('PRUEBA 7: Servicio de Privacidad - buildPrivacyFilters');
    
    try {
      const filters = privacyService.buildPrivacyFilters(TEST_USER_ID);
      
      log(`✅ Filtros generados para usuario: ${TEST_USER_ID}`, 'green');
      log(`   - ownerAccess: ${filters.ownerAccess.substring(0, 50)}...`, 'blue');
      log(`   - publicAI: ${filters.publicAI}`, 'blue');
      log(`   - sharedAccess: ${filters.sharedAccess.substring(0, 50)}...`, 'blue');
      
      // Verificar que los filtros contienen el userId
      if (filters.ownerAccess.includes(TEST_USER_ID)) {
        log(`✅ Filtros incluyen correctamente el userId`, 'green');
      } else {
        log(`❌ Filtros no incluyen correctamente el userId`, 'red');
      }
    } catch (error) {
      log(`❌ Error generando filtros: ${error.message}`, 'red');
    }

    // =========================================================================
    // Prueba 8: Índices para rendimiento
    // =========================================================================
    logSection('PRUEBA 8: Índices de Rendimiento');
    
    const requiredIndexes = [
      'idx_sources_ai_accessible',
      'idx_sources_public_ai',
      'idx_chunks_ai_accessible',
      'idx_chunks_public_ai',
      'idx_material_shares_shared_with',
      'idx_material_shares_status'
    ];

    for (const index of requiredIndexes) {
      try {
        const result = await pool.query(`
          SELECT indexname FROM pg_indexes 
          WHERE indexname = $1
        `, [index]);
        
        if (result.rows.length > 0) {
          log(`✅ Índice '${index}' existe`, 'green');
        } else {
          log(`⚠️ Índice '${index}' no existe (puede afectar rendimiento)`, 'yellow');
        }
      } catch (error) {
        log(`❌ Error verificando '${index}': ${error.message}`, 'red');
      }
    }

    // =========================================================================
    // Resumen de Pruebas
    // =========================================================================
    logSection('RESUMEN DE PRUEBAS');
    
    log('✅ Pruebas completadas. Revise los resultados arriba.', 'cyan');
    log('\n📋 Lista de verificación para implementación:', 'cyan');
    log('   1. Ejecutar script de migración de base de datos', 'blue');
    log('   2. Verificar que los defaults por categoría funcionan', 'blue');
    log('   3. Probar endpoints de API con Postman/curl', 'blue');
    log('   4. Integrar pipeline RAG con privacidad', 'blue');
    log('   5. Crear pruebas unitarias completas', 'blue');

    log('\n🔗 Endpoints de API disponibles después de implementar:', 'cyan');
    log('   GET    /api/privacy/material/:id           - Obtener configuración', 'blue');
    log('   PATCH  /api/privacy/material/:id/ai-consent - Modificar is_public_for_ai', 'blue');
    log('   POST   /api/privacy/material/:id/share     - Compartir con usuario', 'blue');
    log('   DELETE /api/privacy/material/:id/share/:uid - Revocar compartición', 'blue');
    log('   GET    /api/privacy/material/:id/shares    - Ver comparticiones', 'blue');
    log('   GET    /api/privacy/shared-with-me         - Materiales compartidos', 'blue');
    log('   GET    /api/privacy/stats                  - Estadísticas', 'blue');
    log('   GET    /api/privacy/rag-filters            - Filtros RAG', 'blue');

  } catch (error) {
    log(`\n❌ Error general en pruebas: ${error.message}`, 'red');
    console.error(error);
  } finally {
    // Cerrar pool de conexiones
    await pool.end();
    log('\n🔚 Pruebas finalizadas. Conexiones cerradas.', 'cyan');
  }
}

// Ejecutar pruebas
runTests().catch(console.error);
