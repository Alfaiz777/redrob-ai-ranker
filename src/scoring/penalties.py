import re

CONSULTING_COMPANIES = {
    "TCS",
    "Infosys",
    "Wipro",
    "Accenture",
    "Cognizant",
    "Capgemini",
    "HCL",
    "Tech Mahindra",
    "Mindtree",
    "Mphasis"
}


AI_KEYWORDS = [
    "retrieval",
    "ranking",
    "recommendation",
    "embeddings",
    "vector database",
    "vector search",
    "pinecone",
    "qdrant",
    "weaviate",
    "faiss",
    "machine learning",
    "llm",
    "rag",
    "semantic search",
    "hybrid search",
    "dense retrieval",
    "recommendation system",
    "recommendation engine",
    "learning to rank",
    "ndcg",
    "mrr",
    "map"
]


NON_AI_TITLES = [
    "marketing manager",
    "sales executive",
    "hr manager",
    "accountant",
    "content writer",
    "customer support",
    "operations manager"
]


AI_TITLES = [
    "engineer",
    "scientist",
    "ml",
    "machine learning",
    "ai",
    "search",
    "recommendation",
    "retrieval",
    "nlp",
    "data scientist"
]


def calculate_penalties(candidate):

    penalty_score = 0

    penalty_evidence = []

    companies = candidate.get(
        "companies",
        []
    )

    title = (
        candidate.get(
            "title",
            ""
        )
        .lower()
    )

    career_text = (
        candidate.get(
            "career_text",
            ""
        )
        .lower()
    )

    # ==========================
    # Consulting Only Career
    # ==========================

    if companies:

        consulting_count = sum(
            1
            for company in companies
            if company in CONSULTING_COMPANIES
        )

        if consulting_count == len(companies):

            penalty_score += 15

            penalty_evidence.append(
                "Consulting Only Career"
            )

    # ==========================
    # AI Keyword Count
    # ==========================

    ai_keyword_count = sum(
        1
        for keyword in AI_KEYWORDS
        if re.search(
            rf"\b{re.escape(keyword)}\b",
            career_text
        )
    )

    # ==========================
    # Title / Career Mismatch
    # ==========================

    title_is_non_ai = any(
        bad_title in title
        for bad_title in NON_AI_TITLES
    )

    if (
        title_is_non_ai
        and ai_keyword_count >= 3
    ):

        penalty_score += 25

        penalty_evidence.append(
            "Title Career Mismatch"
        )

    # ==========================
    # Keyword Stuffing Trap
    # JD explicitly warns about this
    # ==========================

    title_is_ai = any(
        keyword in title
        for keyword in AI_TITLES
    )

    if (
        not title_is_ai
        and ai_keyword_count >= 4
    ):

        penalty_score += 40

        penalty_evidence.append(
            "Keyword Stuffed Profile"
        )

    # ==========================
    # Possible Job Hopping
    # ==========================

    unique_companies = set(
        companies
    )

    if len(unique_companies) >= 6:

        penalty_score += 10

        penalty_evidence.append(
            "Possible Job Hopping"
        )

    # ==========================
    # Non-NLP AI Domain
    # CV/speech/robotics engineers without NLP/IR exposure
    # JD explicitly lists this as a negative signal
    # ==========================

    CV_DOMAIN_KEYWORDS = [
        "object detection", "image classification", "computer vision",
        "yolo", "segmentation", "ocr", "face recognition", "image processing",
    ]

    SPEECH_DOMAIN_KEYWORDS = [
        "speech recognition", "asr", "tts", "text-to-speech",
        "audio processing", "speech synthesis", "voice recognition",
    ]

    NLP_IR_KEYWORDS = [
        "nlp", "retrieval", "search", "ranking", "recommendation",
        "embedding", "information retrieval", "text classification",
        "semantic", "natural language",
    ]

    cv_count = sum(
        1 for kw in CV_DOMAIN_KEYWORDS
        if re.search(rf"\b{re.escape(kw)}\b", career_text)
    )

    speech_count = sum(
        1 for kw in SPEECH_DOMAIN_KEYWORDS
        if re.search(rf"\b{re.escape(kw)}\b", career_text)
    )

    nlp_ir_count = sum(
        1 for kw in NLP_IR_KEYWORDS
        if re.search(rf"\b{re.escape(kw)}\b", career_text)
    )

    off_domain_count = cv_count + speech_count

    if off_domain_count >= 3 and nlp_ir_count <= 1:

        penalty_score += 25

        penalty_evidence.append(
            f"Non-NLP AI domain (CV/Speech signals={off_domain_count}, NLP/IR signals={nlp_ir_count})"
        )

    # ==========================
    # LLM-Only Era Detection
    # Post-2022 LangChain/OpenAI wrappers without pre-LLM ML production
    # JD explicitly says this is disqualifying unless pre-LLM track record exists
    # ==========================

    LLM_ERA_KEYWORDS = [
        "langchain", "openai api", "gpt-4", "chatgpt",
        "rag pipeline", "llm fine-tuning", "llamaindex", "llm application",
        "prompt engineering", "chat completion",
    ]

    PRE_LLM_PRODUCTION_KEYWORDS = [
        "ranking model", "learning to rank", "recommendation engine",
        "a/b testing", "ndcg", "offline evaluation", "production ml",
        "feature pipeline", "model serving", "ml pipeline",
    ]

    llm_era_count = sum(
        1 for kw in LLM_ERA_KEYWORDS
        if kw in career_text
    )

    pre_llm_count = sum(
        1 for kw in PRE_LLM_PRODUCTION_KEYWORDS
        if re.search(rf"\b{re.escape(kw)}\b", career_text)
    )

    if llm_era_count >= 3 and pre_llm_count == 0:

        penalty_score += 20

        penalty_evidence.append(
            f"LLM-only profile: no pre-LLM production ML evidence "
            f"(LLM signals={llm_era_count}, pre-LLM signals={pre_llm_count})"
        )

    # ==========================
    # Pure Research / Academic
    # JD says "we will not move forward" for pure researchers
    # Only fires when research dominates AND production evidence is absent
    # ==========================

    RESEARCH_KEYWORDS = [
        "phd", "research lab", "arxiv", "academic",
        "published paper", "conference paper", "thesis",
        "university research", "research scientist",
    ]

    PRODUCTION_KEYWORDS = [
        "production", "shipped", "deployed", "launched", "at scale",
        "real users", "serving", "latency", "throughput",
    ]

    research_count = sum(
        1 for kw in RESEARCH_KEYWORDS
        if kw in career_text
    )

    production_count = sum(
        1 for kw in PRODUCTION_KEYWORDS
        if kw in career_text
    )

    if research_count >= 2 and production_count == 0:

        penalty_score += 15

        penalty_evidence.append(
            f"Pure research profile: no production deployment evidence "
            f"(research signals={research_count}, production signals={production_count})"
        )

    return {
        "penalty_score":
            penalty_score,

        "penalty_evidence":
            penalty_evidence
    }