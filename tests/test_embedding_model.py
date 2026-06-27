from src.retrieval.embedding_model import (
    get_embedding_model
)


model = get_embedding_model()

embedding = model.encode(
    "recommendation systems engineer"
)

print(
    "Embedding Shape:",
    embedding.shape
)