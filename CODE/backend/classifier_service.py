
# LEGAL MATE AI
# Legal Intent Classification Service

import re


LEGAL_CATEGORIES = {
    "consumer_complaint": {
        "domain": "Consumer Law",
        "keywords": [
            "refund", "defective product", "damaged product",
            "consumer", "warranty", "replacement",
            "online shopping", "seller", "purchase"
        ]
    },

    "employment_issue": {
        "domain": "Employment Law",
        "keywords": [
            "salary", "wages", "employer", "employee",
            "termination", "job", "workplace",
            "unpaid salary", "employment"
        ]
    },

    "property_dispute": {
        "domain": "Property Law",
        "keywords": [
            "property", "land", "house", "rent",
            "tenant", "landlord", "ownership",
            "property dispute"
        ]
    },

    "cyber_crime": {
        "domain": "Cyber Crime",
        "keywords": [
            "online fraud", "hacking", "cyber crime",
            "phishing", "online scam", "identity theft",
            "upi fraud", "digital fraud"
        ]
    },

    "family_law": {
        "domain": "Family Law",
        "keywords": [
            "divorce", "marriage", "maintenance",
            "custody", "domestic violence",
            "family dispute"
        ]
    }
}


def normalize_text(text):
    text = text.lower()
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def predict_intent(user_query):

    query = normalize_text(user_query)

    scores = {}

    for intent, details in LEGAL_CATEGORIES.items():

        score = 0

        for keyword in details["keywords"]:

            if keyword in query:
                score += 1

        scores[intent] = score

    best_intent = max(scores, key=scores.get)

    if scores[best_intent] == 0:

        return {
            "intent": "general_legal_query",
            "domain": "General Legal",
            "confidence": None,
            "status": "fallback"
        }

    return {
        "intent": best_intent,
        "domain": LEGAL_CATEGORIES[best_intent]["domain"],
        "confidence": None,
        "status": "keyword_demo"
    }


def classify_legal_query(user_query):

    result = predict_intent(user_query)

    return (
        result["intent"],
        result["domain"]
    )
