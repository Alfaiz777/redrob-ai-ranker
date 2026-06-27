from src.retrieval.jd_embedding import (
    create_jd_embedding
)

embedding = (
    create_jd_embedding()
)

print(
    "JD Embedding Shape:",
    embedding.shape
)

print(
    embedding[:10]
)