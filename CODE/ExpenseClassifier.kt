package com.miniproject.aismartexpense

object ExpenseClassifier {

    fun classify(merchant: String): String {

        val text = merchant.lowercase()

        // Food
        if (
            text.contains("swiggy") ||
            text.contains("zomato") ||
            text.contains("restaurant") ||
            text.contains("hotel") ||
            text.contains("food") ||
            text.contains("dominos") ||
            text.contains("pizza") ||
            text.contains("kfc") ||
            text.contains("mcdonald")
        ) {
            return "Food"
        }

        // Travel
        if (
            text.contains("uber") ||
            text.contains("ola") ||
            text.contains("rapido") ||
            text.contains("metro") ||
            text.contains("irctc") ||
            text.contains("flight") ||
            text.contains("air india") ||
            text.contains("makemytrip")
        ) {
            return "Travel"
        }

        // Shopping
        if (
            text.contains("amazon") ||
            text.contains("flipkart") ||
            text.contains("myntra") ||
            text.contains("ajio") ||
            text.contains("shopping")
        ) {
            return "Shopping"
        }

        // Entertainment
        if (
            text.contains("netflix") ||
            text.contains("prime video") ||
            text.contains("spotify") ||
            text.contains("youtube") ||
            text.contains("bookmyshow") ||
            text.contains("movie")
        ) {
            return "Entertainment"
        }

        // Groceries
        if (
            text.contains("blinkit") ||
            text.contains("zepto") ||
            text.contains("bigbasket") ||
            text.contains("dmart") ||
            text.contains("grocery")
        ) {
            return "Groceries"
        }

        // Healthcare
        if (
            text.contains("apollo") ||
            text.contains("pharmacy") ||
            text.contains("medplus") ||
            text.contains("hospital") ||
            text.contains("clinic") ||
            text.contains("health")
        ) {
            return "Healthcare"
        }

        // Bills
        if (
            text.contains("electricity") ||
            text.contains("water bill") ||
            text.contains("gas bill") ||
            text.contains("broadband") ||
            text.contains("airtel") ||
            text.contains("jio") ||
            text.contains("vi ") ||
            text.contains("bill")
        ) {
            return "Bills"
        }

        // If nothing matches
        return "Other"
    }
}