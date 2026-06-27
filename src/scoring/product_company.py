PRODUCT_COMPANIES = {

    "Swiggy",
    "Uber",
    "Zomato",
    "Razorpay",
    "CRED",
    "Flipkart",
    "Meesho",
    "InMobi",
    "Zoho",
    "Nykaa",
    "PolicyBazaar",
    "Ola",

    # AI Companies

    "Mad Street Den",

    # Tech Product

    "Google",
    "Amazon",
    "Microsoft",
    "Meta",
    "Netflix"
}


def calculate_product_company_bonus(candidate):

    companies = candidate.get(
        "companies",
        []
    )

    matched_companies = []

    for company in companies:

        if company in PRODUCT_COMPANIES:

            matched_companies.append(
                company
            )

    unique_matches = list(
        set(matched_companies)
    )

    company_count = len(
        unique_matches
    )

    bonus_score = 0

    # ==========================
    # Bonus Logic
    # ==========================

    if company_count >= 3:

        bonus_score = 15

    elif company_count == 2:

        bonus_score = 10

    elif company_count == 1:

        bonus_score = 5

    return {

        "product_bonus_score":
            bonus_score,

        "product_bonus_evidence":
            unique_matches
    }