# NOTE: unused — FAISS IndexFlatIP performs this dot product internally
# over pre-normalized vectors. Kept for reference only.

import numpy as np


def cosine_similarity(
    vector_a,
    vector_b
):

    return float(
        np.dot(
            vector_a,
            vector_b
        )
    )