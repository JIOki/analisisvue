"""
Data Loader para RAG Eval Core
Permite cargar documentos y generar embeddings para pruebas
"""

import os
import json
import uuid
from datetime import datetime
from typing import List, Dict, Optional, Tuple
from pathlib import Path
import logging

import numpy as np
from sqlalchemy import text

from .config import config
from .db_connector import DatabaseConnector
from .embedder import OllamaEmbedder, create_embedder

logger = logging.getLogger(__name__)


class DocumentLoader:
    """Cargador de documentos para el sistema RAG"""
    
    def __init__(self):
        self.db = DatabaseConnector()
        self.embedder = create_embedder()
    
    def test_system(self) -> bool:
        """Prueba que el sistema esté listo"""
        db_ok = self.db.test_connection()
        ollama_ok = self.embedder.test_connection()
        
        return db_ok and ollama_ok
    
    def load_text_file(
        self, 
        file_path: str, 
        chunk_size: int = 500, 
        chunk_overlap: int = 50,
        metadata: Optional[Dict] = None
    ) -> Tuple[int, List[str]]:
        """
        Carga un archivo de texto y lo procesa
        
        Args:
            file_path: Ruta al archivo de texto
            chunk_size: Tamaño de cada chunk
            chunk_overlap: Solapamiento entre chunks
            metadata: Metadatos opcionales del documento
            
        Returns:
            Tuple con (número de chunks, lista de IDs)
        """
        # Verificar que el archivo existe
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"No se encontró el archivo: {file_path}")
        
        # Leer el contenido
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Dividir en chunks
        chunks = self._split_text(content, chunk_size, chunk_overlap)
        
        # Generar embeddings y guardar
        chunk_ids = []
        
        logger.info(f"Procesando {len(chunks)} chunks...")
        
        for i, chunk_text in enumerate(chunks):
            try:
                # Generar embedding
                embedding = self.embedder.embed_text(chunk_text)
                embedding_list = embedding.tolist()
                
                # Insertar en la base de datos
                chunk_id = self._insert_chunk(
                    content=chunk_text,
                    embedding=embedding_list,
                    metadata={
                        **(metadata or {}),
                        "source_file": file_path,
                        "chunk_index": i,
                        "total_chunks": len(chunks)
                    }
                )
                chunk_ids.append(chunk_id)
                
                if (i + 1) % 10 == 0:
                    logger.info(f"Procesados {i + 1}/{len(chunks)} chunks")
                    
            except Exception as e:
                logger.error(f"Error procesando chunk {i}: {e}")
        
        logger.info(f"✅ Completado: {len(chunk_ids)} chunks guardados")
        return len(chunks), chunk_ids
    
    def load_sample_document(
        self, 
        title: str = "Documento de Prueba",
        category: str = "test",
        num_chunks: int = 10
    ) -> Tuple[int, List[str]]:
        """
        Carga un documento de ejemplo con contenido predefinido
        
        Args:
            title: Título del documento
            category: Categoría
            num_chunks: Número de chunks a generar
            
        Returns:
            Tuple con (número de chunks, lista de IDs)
        """
        # Contenido de ejemplo sobre IA y Machine Learning
        sample_texts = [
            """
            INTRODUCCIÓN A LA INTELIGENCIA ARTIFICIAL
            
            La Inteligencia Artificial (IA) es una rama de la ciencia de la computación
            que se ocupa de la creación de sistemas capaces de realizar tareas que
            normalmente requieren inteligencia humana. Esto incluye el aprendizaje,
            el razonamiento, la percepción y la resolución de problemas.
            
            Los sistemas de IA modernos utilizan algoritmos sofisticados y grandes
            cantidades de datos para identificar patrones y tomar decisiones. El
            machine learning es una técnica fundamental que permite a las máquinas
            aprender de la experiencia sin ser programadas explícitamente.
            """,
            
            """
            MACHINE LEARNING FUNDAMENTOS
            
            El Machine Learning (ML) es una técnica de IA que permite a las computadoras
            aprender y mejorar a partir de la experiencia. En lugar de seguir reglas
            predefinidas, los algoritmos de ML identifican patrones en los datos y
            utilizan estos patrones para hacer predicciones o decisiones.
            
            Existen tres tipos principales de Machine Learning:
            
            1. Aprendizaje Supervisado: El algoritmo aprende de datos etiquetados.
            2. Aprendizaje No Supervisado: El algoritmo encuentra patrones sin etiquetas.
            3. Aprendizaje por Refuerzo: El algoritmo aprende mediante prueba y error.
            
            El aprendizaje supervisado requiere datos de entrenamiento con respuestas
            conocidas, mientras que el no supervisado busca estructuras ocultas en datos
            sin etiquetar.
            """,
            
            """
            REDES NEURONALES PROFUNDAS
            
            Las Redes Neuronales Artificiales son sistemas de computación inspirados
            en el funcionamiento del cerebro humano. Cada red neuronal consiste en
            capas de nodos (neuronas) interconectados que procesan información.
            
            El Deep Learning utiliza redes neuronales con muchas capas (de ahí el
            término "profundas") para aprender representaciones complejas de los datos.
            Estas arquitecturas han revolucionado campos como el reconocimiento de
            imágenes, el procesamiento del lenguaje natural y la traducción automática.
            
            Las redes neuronales convolucionales (CNN) son especialmente efectivas
            para el procesamiento de imágenes, mientras que las redes recurrentes
            (RNN) son ideales para datos secuenciales como texto o series temporales.
            """,
            
            """
            PROCESAMIENTO DEL LENGUAJE NATURAL
            
            El Procesamiento del Lenguaje Natural (NLP) es la rama de la IA que
            permite a las computadoras entender, interpretar y generar lenguaje humano.
            Las aplicaciones incluyen traducción automática, análisis de sentimiento,
            chatbots, extracción de información y resumen automático.
            
            Los modelos modernos de NLP como BERT y GPT utilizan arquitecturas de
            transformadores que han logrado resultados revolucionarios. Estos modelos
            son pre-entrenados en grandes corpus de texto y pueden adaptarse a tareas
            específicas mediante fine-tuning.
            
            El embedding de palabras es una técnica fundamental en NLP que convierte
            palabras en representaciones vectoriales densas que capturan relaciones
            semánticas y sintácticas.
            """,
            
            """
            VECTORES DE EMBEDDING Y BÚSQUEDA SEMÁNTICA
            
            Los embeddings son representaciones vectoriales densas de texto que capturan
            el significado semántico. Palabras o frases similares tienen embeddings
            cercanos en el espacio vectorial, lo que permite realizar búsquedas
            semánticas efectivas.
            
            La búsqueda semántica utiliza estos embeddings para encontrar documentos
            relevantes basándose en el significado, no solo en palabras clave. Esto
            mejora significativamente la recuperación de información en sistemas RAG.
            
            Modelos como mxbai-embed-large generan embeddings de alta calidad con
            1024 dimensiones, capturando matices semánticos complejos del texto.
            """,
            
            """
            SISTEMAS RAG (RETRIEVAL-AUGMENTED GENERATION)
            
            RAG es una arquitectura que combina recuperación de información con
            generación de texto. Primero recupera documentos relevantes de una base
            de conocimiento y luego los utiliza como contexto para un modelo generativo.
            
            Los beneficios de RAG incluyen:
            - Acceso a información actualizada sin reentrenamiento
            - Mayor precisión y relevancia de las respuestas
            - Posibilidad de citear fuentes específicas
            - Reducción de alucinaciones en modelos generativos
            
            La efectividad de un sistema RAG depende de la calidad de los embeddings,
            la segmentación adecuada de documentos y la relevancia de los chunks recuperados.
            """,
            
            """
            EVALUACIÓN DE MODELOS DE LENGUAJE
            
            La evaluación de modelos de lenguaje y sistemas RAG requiere métricas
            tanto cuantitativas como cualitativas. Las métricas comunes incluyen:
            
            - Exactitud (Accuracy): Proporción de respuestas correctas
            - Precisión y Recall: Para tareas de recuperación
            - BLEU/ROUGE: Para generación de texto
            - Similitud Semántica: Entre respuesta y referencia humana
            
            Es importante evaluar no solo la calidad de las respuestas sino también
            la relevancia de los documentos recuperados y la coherencia del razonamiento.
            """,
            
            """
            ÉTICA EN INTELIGENCIA ARTIFICIAL
            
            El desarrollo de IA plantea importantes cuestiones éticas que deben
            considerarse. Estas incluyen sesgos en los datos de entrenamiento,
            privacidad, transparencia en las decisiones algorítmicas y el impacto
            social de la automatización.
            
            Los sistemas de IA pueden perpetuar o amplificar sesgos presentes en
            sus datos de entrenamiento, lo que lleva a decisiones injustas. Es
            crucial implementar prácticas de IA responsable que incluyan auditoría
            de sesgos, explicabilidad y mecanismos de corrección.
            """,
            
            """
            APLICACIONES DE LA INTELIGENCIA ARTIFICIAL
            
            La IA tiene aplicaciones en prácticamente todos los sectores:
            
            - Salud: Diagnóstico por imagen, descubrimiento de medicamentos
            - Finanzas: Detección de fraude, trading algorítmico
            - Manufactura: Mantenimiento predictivo, control de calidad
            - Retail: Recomendación de productos, análisis de clientes
            - Educación: Aprendizaje personalizado, tutores inteligentes
            
            En cada dominio, la IA está transformando procesos tradicionales y
            creando nuevas posibilidades para la innovación y la eficiencia.
            """,
            
            """
            FUTURO DE LA INTELIGENCIA ARTIFICIAL
            
            El futuro de la IA promete avances significativos en capacidades
            cognitivas, razonamiento multi-modal y colaboración humano-máquina.
            Las tendencias actuales incluyen modelos multimodales que integran
            texto, imágenes y audio, así como sistemas más eficientes y explicables.
            
            La IA explicable (XAI) busca hacer que las decisiones de los sistemas
            de IA sean comprensibles para los humanos, lo cual es crucial para
            aplicaciones en áreas críticas como medicina y justicia.
            
            El desarrollo responsable de IA será fundamental para garantizar que
            estos avances beneficien a la sociedad en su conjunto.
            """
        ]
        
        # Combinar textos para crear el documento completo
        full_text = "\n\n".join(sample_texts[:num_chunks])
        
        # Dividir en chunks
        chunks = self._split_text(full_text, 500, 50)
        
        # Generar embeddings y guardar
        chunk_ids = []
        
        logger.info(f"Cargando documento de prueba con {len(chunks)} chunks...")
        
        for i, chunk_text in enumerate(chunks):
            try:
                embedding = self.embedder.embed_text(chunk_text)
                embedding_list = embedding.tolist()
                
                chunk_id = self._insert_chunk(
                    content=chunk_text,
                    embedding=embedding_list,
                    metadata={
                        "title": title,
                        "category": category,
                        "chunk_index": i,
                        "total_chunks": len(chunks),
                        "is_sample": True
                    }
                )
                chunk_ids.append(chunk_id)
                
            except Exception as e:
                logger.error(f"Error en chunk {i}: {e}")
        
        logger.info(f"✅ Cargados {len(chunk_ids)} chunks de prueba")
        return len(chunks), chunk_ids
    
    def _split_text(self, text: str, chunk_size: int, overlap: int) -> List[str]:
        """
        Divide el texto en chunks con solapamiento
        """
        # Limpiar texto
        text = text.strip()
        
        if not text:
            return []
        
        chunks = []
        start = 0
        text_len = len(text)
        
        while start < text_len:
            end = min(start + chunk_size, text_len)
            
            # Intentar dividir en oración o párrafo
            if end < text_len:
                # Buscar último punto o nueva línea
                last_period = text.rfind('.', start, end)
                last_newline = text.rfind('\n', start, end)
                split_point = max(last_period, last_newline)
                
                if split_point > start:
                    end = split_point + 1
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            # Mover start con solapamiento
            start = end - overlap
            if start >= text_len:
                break
        
        return chunks
    
    def _insert_chunk(
        self, 
        content: str, 
        embedding: List[float], 
        metadata: Dict
    ) -> str:
        """
        Inserta un chunk en la base de datos
        """
        chunk_id = str(uuid.uuid4())
        
        with self.db.get_session() as session:
            session.execute(text("""
                INSERT INTO document_chunks (id, content, metadata, embedding, created_at)
                VALUES (:id, :content, :metadata, :embedding, :created_at)
            """), {
                "id": chunk_id,
                "content": content,
                "metadata": json.dumps(metadata),
                "embedding": json.dumps(embedding),
                "created_at": datetime.now().isoformat()
            })
        
        return chunk_id
    
    def get_chunk_count(self) -> int:
        """Retorna el número total de chunks"""
        return self.db.count_chunks()
    
    def clear_all_chunks(self, confirm: bool = False) -> int:
        """
        Elimina todos los chunks de la base de datos
        
        Args:
            confirm: Si es True, elimina sin preguntar
        """
        if not confirm:
            count = self.get_chunk_count()
            response = input(f"¿Eliminar {count} chunks? (escribe 'ELIMINAR' para confirmar): ")
            if response != "ELIMINAR":
                print("Operación cancelada")
                return 0
        
        with self.db.get_session() as session:
            session.execute(text("DELETE FROM document_chunks"))
        
        count = self.get_chunk_count()
        logger.info(f"✅ Eliminados todos los chunks")
        return count
    
    def close(self):
        """Cierra las conexiones"""
        self.db.close()


def main():
    """CLI principal"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Cargador de Documentos para RAG")
    subparsers = parser.add_subparsers(dest="command")
    
    # Cargar documento de prueba
    test_parser = subparsers.add_parser("load-sample", help="Cargar documento de prueba")
    test_parser.add_argument("--title", default="Documento de Prueba IA", help="Título")
    test_parser.add_argument("--chunks", type=int, default=10, help="Número de chunks")
    
    # Cargar archivo
    file_parser = subparsers.add_parser("load-file", help="Cargar archivo de texto")
    file_parser.add_argument("path", help="Ruta al archivo")
    file_parser.add_argument("--chunk-size", type=int, default=500)
    file_parser.add_argument("--chunk-overlap", type=int, default=50)
    
    # Ver estado
    subparsers.add_parser("status", help="Ver estado del sistema")
    
    # Limpiar
    subparsers.add_parser("clear", help="Eliminar todos los chunks")
    
    args = parser.parse_args()
    
    loader = DocumentLoader()
    
    if args.command == "status":
        print("\n📊 Estado del Sistema:")
        print(f"   Base de datos: {'✅ OK' if loader.db.test_connection() else '❌ FAIL'}")
        print(f"   Ollama: {'✅ OK' if loader.embedder.test_connection() else '❌ FAIL'}")
        print(f"   Total chunks: {loader.get_chunk_count()}")
    
    elif args.command == "load-sample":
        print(f"\n📄 Cargando documento de prueba: {args.title}")
        count, ids = loader.load_sample_document(
            title=args.title,
            num_chunks=args.chunks
        )
        print(f"✅ Cargados {count} chunks")
        print(f"   IDs: {ids[:3]}{'...' if len(ids) > 3 else ''}")
    
    elif args.command == "load-file":
        if not os.path.exists(args.path):
            print(f"❌ No se encontró el archivo: {args.path}")
            return
        
        print(f"\n📄 Cargando archivo: {args.path}")
        count, ids = loader.load_text_file(
            file_path=args.path,
            chunk_size=args.chunk_size,
            chunk_overlap=args.chunk_overlap
        )
        print(f"✅ Cargados {count} chunks")
    
    elif args.command == "clear":
        count = loader.clear_all_chunks()
        print(f"✅ Eliminados {count} chunks")
    
    else:
        parser.print_help()
    
    loader.close()


if __name__ == "__main__":
    main()
