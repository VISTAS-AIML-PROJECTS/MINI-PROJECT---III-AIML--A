
package com.miniproject.aismartexpense

object NaiveBayesClassifier {

    private val merchantCategories = mapOf(
        "swiggy" to "Food",
        "zomato" to "Food",
        "dominos" to "Food",
        "pizza" to "Food",
        "kfc" to "Food",
        "mcdonald" to "Food",
        "burger" to "Food",
        "restaurant" to "Food",
        "cafe" to "Food",

        "uber" to "Travel",
        "ola" to "Travel",
        "rapido" to "Travel",
        "metro" to "Travel",
        "irctc" to "Travel",
        "makemytrip" to "Travel",
        "air india" to "Travel",

        "electricity" to "Bills",
        "water bill" to "Bills",
        "gas bill" to "Bills",
        "broadband" to "Bills",
        "airtel" to "Bills",
        "jio" to "Bills",
        "vodafone" to "Bills",

        "amazon" to "Shopping",
        "flipkart" to "Shopping",
        "myntra" to "Shopping",
        "ajio" to "Shopping",
        "meesho" to "Shopping",
        "fashion" to "Shopping",
        "clothing" to "Shopping",

        "netflix" to "Entertainment",
        "spotify" to "Entertainment",
        "youtube" to "Entertainment",
        "prime video" to "Entertainment",
        "bookmyshow" to "Entertainment",
        "cinema" to "Entertainment",
        "gaming" to "Entertainment",

        "blinkit" to "Groceries",
        "zepto" to "Groceries",
        "bigbasket" to "Groceries",
        "dmart" to "Groceries",
        "grocery" to "Groceries",
        "supermarket" to "Groceries",

        "apollo pharmacy" to "Healthcare",
        "medplus" to "Healthcare",
        "pharmacy" to "Healthcare",
        "hospital" to "Healthcare",
        "clinic" to "Healthcare",
        "medicine" to "Healthcare"
    )

    fun classify(merchant: String): String {
        val name = merchant.trim().lowercase()

        if (name.isBlank()) return "Other"

        // Prefer the longest matching merchant keyword.
        val match = merchantCategories.entries
            .filter { name.contains(it.key) }
            .maxByOrNull { it.key.length }

        return match?.value ?: "Other"
    }
}
