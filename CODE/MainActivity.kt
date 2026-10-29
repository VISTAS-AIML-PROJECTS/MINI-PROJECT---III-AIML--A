package com.miniproject.aismartexpense

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.SharedPreferences
import android.os.Bundle
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Divider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import java.util.Calendar

private val Background = Color(0xFF080B12)
private val CardColor = Color(0xFF111722)
private val CardColor2 = Color(0xFF151C29)
private val Accent = Color(0xFF7C5CFF)
private val Accent2 = Color(0xFF00D4FF)
private val Green = Color(0xFF35D07F)
private val Red = Color(0xFFFF5C72)
private val TextPrimary = Color(0xFFF5F7FA)
private val TextSecondary = Color(0xFF9299A8)

private val AppDarkColors = darkColorScheme(
    primary = Accent,
    secondary = Accent2,
    background = Background,
    surface = CardColor,
    onBackground = TextPrimary,
    onSurface = TextPrimary
)

enum class AppPage {
    HOME,
    TRANSACTIONS,
    ADD_EXPENSE,
    AI,
    PREDICTION
}

class MainActivity : ComponentActivity() {

    private lateinit var preferences: SharedPreferences

    private var expensesState = mutableStateOf<List<Expense>>(emptyList())
    private var monthlyTotalsState = mutableStateOf<List<Double>>(emptyList())
    private var userNameState = mutableStateOf("")

    private val transactionReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action ==
                "com.miniproject.aismartexpense.NEW_TRANSACTION"
            ) {
                loadData()
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        preferences = getSharedPreferences(
            "app_preferences",
            Context.MODE_PRIVATE
        )

        userNameState.value =
            preferences.getString("user_name", "") ?: ""

        loadData()

        setContent {
            MaterialTheme(colorScheme = AppDarkColors) {

                val name = userNameState.value

                if (name.isBlank()) {
                    NameSetupScreen(
                        onNameSaved = { enteredName ->
                            preferences.edit()
                                .putString("user_name", enteredName)
                                .putBoolean("name_setup_completed", true)
                                .apply()

                            userNameState.value = enteredName
                        }
                    )
                } else {
                    ExpenseApp(
                        userName = name,
                        expenses = expensesState.value,
                        monthlyTotals = monthlyTotalsState.value,
                        onRefresh = {
                            loadData()
                        }
                    )
                }
            }
        }
    }

    override fun onStart() {
        super.onStart()

        ContextCompat.registerReceiver(
            this,
            transactionReceiver,
            IntentFilter("com.miniproject.aismartexpense.NEW_TRANSACTION"),
            ContextCompat.RECEIVER_NOT_EXPORTED
        )

        loadData()
    }

    override fun onStop() {
        super.onStop()

        try {
            unregisterReceiver(transactionReceiver)
        } catch (_: Exception) {
        }
    }

    override fun onResume() {
        super.onResume()
        loadData()
    }

    private fun loadData() {
        try {
            val db = DatabaseHelper(this)

            expensesState.value = db.getAllExpenses()
            monthlyTotalsState.value = db.getMonthlyExpenseTotals()
        } catch (_: Exception) {
        }
    }

    companion object {

        fun isNotificationAccessEnabled(context: Context): Boolean {
            val enabledListeners =
                Settings.Secure.getString(
                    context.contentResolver,
                    "enabled_notification_listeners"
                )

            return enabledListeners?.contains(
                context.packageName
            ) == true
        }
    }
}

@Composable
fun NameSetupScreen(
    onNameSaved: (String) -> Unit
) {
    var name by remember {
        mutableStateOf("")
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(
                        Color(0xFF10162A),
                        Background
                    )
                )
            )
            .padding(28.dp),
        contentAlignment = Alignment.Center
    ) {

        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {

            Box(
                modifier = Modifier
                    .size(82.dp)
                    .clip(RoundedCornerShape(26.dp))
                    .background(
                        Brush.linearGradient(
                            listOf(Accent, Accent2)
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "₹",
                    fontSize = 42.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }

            Spacer(modifier = Modifier.height(28.dp))

            Text(
                text = "Welcome!",
                fontSize = 32.sp,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Let's personalize your\nsmart expense tracker.",
                fontSize = 17.sp,
                color = TextSecondary,
                lineHeight = 25.sp,
                textAlign = androidx.compose.ui.text.style.TextAlign.Center
            )

            Spacer(modifier = Modifier.height(32.dp))

            OutlinedTextField(
                value = name,
                onValueChange = {
                    name = it
                },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                label = {
                    Text("Your name")
                },
                placeholder = {
                    Text("Enter your name")
                },
                shape = RoundedCornerShape(18.dp)
            )

            Spacer(modifier = Modifier.height(18.dp))

            Button(
                onClick = {
                    if (name.trim().isNotEmpty()) {
                        onNameSaved(name.trim())
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                shape = RoundedCornerShape(18.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Accent
                )
            ) {
                Text(
                    text = "Get Started",
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(18.dp))

            Text(
                text = "Your name is stored only on this device.",
                fontSize = 12.sp,
                color = TextSecondary
            )
        }
    }
}

@Composable
fun ExpenseApp(
    userName: String,
    expenses: List<Expense>,
    monthlyTotals: List<Double>,
    onRefresh: () -> Unit
) {

    var currentPage by remember {
        mutableStateOf(AppPage.HOME)
    }

    val context = LocalContext.current

    var showNotificationDialog by remember {
        mutableStateOf(
            !MainActivity.isNotificationAccessEnabled(context)
        )
    }

    /*
     * Re-check notification access whenever the app becomes active.
     */
    LaunchedEffect(Unit) {

        while (true) {

            val enabled =
                MainActivity.isNotificationAccessEnabled(context)

            if (!enabled) {
                showNotificationDialog = true
            } else {
                showNotificationDialog = false
            }

            onRefresh()

            kotlinx.coroutines.delay(1000)
        }
    }

    if (showNotificationDialog) {

        AlertDialog(
            onDismissRequest = {
                showNotificationDialog = false
            },
            title = {
                Text(
                    text = "Enable Smart Expense Detection",
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Text(
                    "Allow notification access so the app can detect supported payment notifications and automatically save expenses."
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        showNotificationDialog = false

                        context.startActivity(
                            Intent(
                                "android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS"
                            )
                        )
                    }
                ) {
                    Text("Open Settings")
                }
            },
            dismissButton = {
                TextButton(
                    onClick = {
                        showNotificationDialog = false
                    }
                ) {
                    Text("Not Now")
                }
            }
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
    ) {

        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
        ) {

            when (currentPage) {

                AppPage.HOME -> {
                    HomeScreen(
                        userName = userName,
                        expenses = expenses,
                        monthlyTotals = monthlyTotals,
                        onPredictionClick = {
                            currentPage = AppPage.PREDICTION
                        }
                    )
                }

                AppPage.TRANSACTIONS -> {
                    TransactionsScreen(
                        expenses = expenses,
                        onRefresh = onRefresh
                    )
                }

                AppPage.ADD_EXPENSE -> {
                    AddExpenseScreen(
                        onExpenseAdded = {
                            onRefresh()
                            currentPage = AppPage.TRANSACTIONS
                        }
                    )
                }

                AppPage.AI -> {
                    AiScreen(
                        expenses = expenses
                    )
                }

                AppPage.PREDICTION -> {
                    PredictionScreen(
                        monthlyTotals = monthlyTotals
                    )
                }
            }
        }

        BottomNavigationBar(
            currentPage = currentPage,
            onPageSelected = {
                currentPage = it
            }
        )
    }
}

@Composable
fun HomeScreen(
    userName: String,
    expenses: List<Expense>,
    monthlyTotals: List<Double>,
    onPredictionClick: () -> Unit
) {

    val total =
        expenses.sumOf {
            it.amount.replace("₹", "")
                .replace(",", "")
                .toDoubleOrNull() ?: 0.0
        }

    val prediction =
        LinearRegressionPredictor.predict(monthlyTotals)

    val greeting = when (Calendar.getInstance().get(Calendar.HOUR_OF_DAY)) {
        in 5..11 -> "Good morning"
        in 12..16 -> "Good afternoon"
        in 17..20 -> "Good evening"
        else -> "Good night"
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {

        item {
            Spacer(modifier = Modifier.height(18.dp))

            Text(
                text = "$greeting, $userName 👋",
                fontSize = 26.sp,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )

            Text(
                text = "Here's your financial overview",
                fontSize = 14.sp,
                color = TextSecondary
            )
        }

        item {
            TotalExpenseCard(total)
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {

                SmallStatCard(
                    title = "Transactions",
                    value = expenses.size.toString(),
                    modifier = Modifier.weight(1f)
                )

                SmallStatCard(
                    title = "Categories",
                    value = expenses
                        .map { it.category }
                        .distinct()
                        .size
                        .toString(),
                    modifier = Modifier.weight(1f)
                )
            }
        }

        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable {
                        onPredictionClick()
                    },
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(
                    containerColor = CardColor
                )
            ) {

                Column(
                    modifier = Modifier.padding(20.dp)
                ) {

                    Text(
                        text = "AI Future Prediction",
                        fontSize = 14.sp,
                        color = Accent2,
                        fontWeight = FontWeight.Bold
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    if (prediction != null) {

                        Text(
                            text = "₹${prediction.toInt()}",
                            fontSize = 30.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )

                        Text(
                            text = "Predicted next-month spending",
                            color = TextSecondary,
                            fontSize = 13.sp
                        )

                    } else {

                        Text(
                            text = "Need more data",
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )

                        Text(
                            text = "Add expenses across at least 2 months.",
                            color = TextSecondary,
                            fontSize = 13.sp
                        )
                    }
                }
            }
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(
                    containerColor = CardColor
                )
            ) {

                Column(
                    modifier = Modifier.padding(20.dp)
                ) {

                    Text(
                        text = "AI Categorization",
                        color = Green,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = "Naive Bayes",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )

                    Text(
                        text = "Automatically categorizes supported expenses.",
                        fontSize = 13.sp,
                        color = TextSecondary
                    )
                }
            }
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(
                    containerColor = CardColor
                )
            ) {
                Column(
                    modifier = Modifier.padding(20.dp)
                ) {
                    Text(
                        text = "Monthly Spending",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = "Actual expenses by recorded month",
                        fontSize = 13.sp,
                        color = TextSecondary
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    if (monthlyTotals.isEmpty()) {
                        Text(
                            text = "Add expenses to see your graph.",
                            color = TextSecondary
                        )
                    } else {
                        val prediction = LinearRegressionPredictor.predict(monthlyTotals)

                        val maxTotal = (
                                monthlyTotals.takeLast(6) + listOfNotNull(prediction)
                                ).maxOrNull()?.coerceAtLeast(1.0) ?: 1.0

                        monthlyTotals.takeLast(6)
                            .forEachIndexed { index, value ->
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(bottom = 14.dp)
                                ) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement =
                                            Arrangement.SpaceBetween
                                    ) {
                                        Text(
                                            text = "Month ${monthlyTotals.size -
                                                    monthlyTotals.takeLast(6).size +
                                                    index + 1}",
                                            color = TextSecondary,
                                            fontSize = 12.sp
                                        )

                                        Text(
                                            text = "₹${value.toInt()}",
                                            color = TextPrimary,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 12.sp
                                        )
                                    }

                                    Spacer(
                                        modifier = Modifier.height(7.dp)
                                    )

                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(10.dp)
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(
                                                Color(0xFF293044)
                                            )
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .fillMaxWidth(
                                                    (value / maxTotal)
                                                        .toFloat()
                                                        .coerceIn(0f, 1f)
                                                )
                                                .height(10.dp)
                                                .clip(
                                                    RoundedCornerShape(8.dp)
                                                )
                                                .background(
                                                    Brush.horizontalGradient(
                                                        listOf(
                                                            Color(0xFF7254FF),
                                                            Color(0xFF268EFF)
                                                        )
                                                    )
                                                )
                                        )
                                    }
                                }
                            }
                        if (prediction != null) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(bottom = 14.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement =
                                        Arrangement.SpaceBetween
                                ) {
                                    Text(
                                        text = "Predicted next month",
                                        color = Color(0xFF55D6BE),
                                        fontSize = 12.sp
                                    )

                                    Text(
                                        text = "₹${prediction.toInt()}",
                                        color = Color(0xFF55D6BE),
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp
                                    )
                                }

                                Spacer(
                                    modifier = Modifier.height(7.dp)
                                )

                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(10.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(Color(0xFF293044))
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth(
                                                (prediction / maxTotal)
                                                    .toFloat()
                                                    .coerceIn(0f, 1f)
                                            )
                                            .height(10.dp)
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(Color(0xFF55D6BE))
                                    )
                                }
                            }
                        }
                    }
                }
                    }

                }

        item {
            Spacer(modifier = Modifier.height(10.dp))
        }
    }
}

@Composable
fun TotalExpenseCard(total: Double) {

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(28.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color.Transparent
        )
    ) {

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.linearGradient(
                        listOf(
                            Color(0xFF7254FF),
                            Color(0xFF268EFF)
                        )
                    ),
                    RoundedCornerShape(28.dp)
                )
                .padding(24.dp)
        ) {

            Column {

                Text(
                    text = "TOTAL EXPENSES",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White.copy(alpha = 0.75f)
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "₹${String.format("%.2f", total)}",
                    fontSize = 36.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )

                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text = "All recorded expenses",
                    fontSize = 13.sp,
                    color = Color.White.copy(alpha = 0.75f)
                )
            }
        }
    }
}

@Composable
fun SmallStatCard(
    title: String,
    value: String,
    modifier: Modifier
) {

    Card(
        modifier = modifier,
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(
            containerColor = CardColor
        )
    ) {

        Column(
            modifier = Modifier.padding(18.dp)
        ) {

            Text(
                text = title,
                fontSize = 12.sp,
                color = TextSecondary
            )

            Spacer(modifier = Modifier.height(7.dp))

            Text(
                text = value,
                fontSize = 25.sp,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
        }
    }
}

@Composable
fun TransactionsScreen(
    expenses: List<Expense>,
    onRefresh: () -> Unit
) {

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 20.dp)
    ) {

        Spacer(modifier = Modifier.height(22.dp))

        Text(
            text = "Transactions",
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold,
            color = TextPrimary
        )

        Text(
            text = "${expenses.size} recorded transactions",
            color = TextSecondary,
            fontSize = 14.sp
        )

        Spacer(modifier = Modifier.height(18.dp))

        if (expenses.isEmpty()) {

            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {

                Column(
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {

                    Text(
                        text = "No transactions yet",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = "Your expenses will appear here.",
                        color = TextSecondary
                    )
                }
            }

        } else {

            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {

                items(expenses) { expense ->

                    TransactionCard(
                        expense = expense,
                        onDeleted = onRefresh
                    )
                }

                item {
                    Spacer(modifier = Modifier.height(20.dp))
                }
            }
        }
    }
}

@Composable
fun TransactionCard(
    expense: Expense,
    onDeleted: () -> Unit
) {

    val context = LocalContext.current

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(
            containerColor = CardColor
        )
    ) {

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {

            Box(
                modifier = Modifier
                    .size(46.dp)
                    .clip(RoundedCornerShape(15.dp))
                    .background(CardColor2),
                contentAlignment = Alignment.Center
            ) {

                Text(
                    text = categoryEmoji(expense.category),
                    fontSize = 21.sp
                )
            }

            Spacer(modifier = Modifier.width(13.dp))

            Column(
                modifier = Modifier.weight(1f)
            ) {

                Text(
                    text = expense.merchant,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = TextPrimary
                )

                Text(
                    text = expense.category,
                    fontSize = 12.sp,
                    color = Accent2
                )

                Spacer(modifier = Modifier.height(3.dp))

                Text(
                    text = "${expense.date} • ${expense.time}",
                    fontSize = 11.sp,
                    color = TextSecondary
                )
            }

            Column(
                horizontalAlignment = Alignment.End
            ) {

                Text(
                    text = "-${expense.amount}",
                    fontWeight = FontWeight.Bold,
                    color = Red,
                    fontSize = 15.sp
                )

                Spacer(modifier = Modifier.height(4.dp))

                TextButton(
                    onClick = {

                        val db =
                            DatabaseHelper(context)

                        val amount =
                            expense.amount
                                .replace("₹", "")
                                .replace(",", "")
                                .toDoubleOrNull()
                                ?: 0.0

                        db.deleteExpense(
                            expense.merchant,
                            amount,
                            expense.category
                        )

                        onDeleted()
                    }
                ) {

                    Text(
                        text = "Delete",
                        fontSize = 11.sp,
                        color = TextSecondary
                    )
                }
            }
        }
    }
}

@Composable
fun AddExpenseScreen(
    onExpenseAdded: () -> Unit
) {

    val context = LocalContext.current

    var merchant by remember {
        mutableStateOf("")
    }

    var amount by remember {
        mutableStateOf("")
    }

    var category by remember {
        mutableStateOf("Other")
    }

    var error by remember {
        mutableStateOf("")
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp)
    ) {

        Spacer(modifier = Modifier.height(20.dp))

        Text(
            text = "Add Expense",
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold,
            color = TextPrimary
        )

        Text(
            text = "Manually record a transaction",
            color = TextSecondary
        )

        Spacer(modifier = Modifier.height(24.dp))

        OutlinedTextField(
            value = merchant,
            onValueChange = {
                merchant = it
            },
            modifier = Modifier.fillMaxWidth(),
            label = {
                Text("Merchant")
            },
            placeholder = {
                Text("e.g. Swiggy")
            },
            singleLine = true,
            shape = RoundedCornerShape(18.dp)
        )

        Spacer(modifier = Modifier.height(14.dp))

        OutlinedTextField(
            value = amount,
            onValueChange = {
                amount = it
            },
            modifier = Modifier.fillMaxWidth(),
            label = {
                Text("Amount")
            },
            placeholder = {
                Text("e.g. 350")
            },
            singleLine = true,
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Decimal
            ),
            shape = RoundedCornerShape(18.dp)
        )

        Spacer(modifier = Modifier.height(14.dp))

        OutlinedTextField(
            value = category,
            onValueChange = {
                category = it
            },
            modifier = Modifier.fillMaxWidth(),
            label = {
                Text("Category")
            },
            singleLine = true,
            shape = RoundedCornerShape(18.dp)
        )

        Spacer(modifier = Modifier.height(22.dp))

        if (error.isNotEmpty()) {

            Text(
                text = error,
                color = Red,
                fontSize = 13.sp
            )

            Spacer(modifier = Modifier.height(10.dp))
        }

        Button(
            onClick = {

                val amountValue =
                    amount.toDoubleOrNull()

                if (merchant.trim().isEmpty()) {

                    error = "Enter a merchant name."

                } else if (
                    amountValue == null ||
                    amountValue <= 0
                ) {

                    error = "Enter a valid amount."

                } else {

                    val detectedCategory =
                        NaiveBayesClassifier.classify(merchant.trim())

                    val db = DatabaseHelper(context)

                    db.addExpense(
                        merchant.trim(),
                        amountValue,
                        detectedCategory
                    )

                    merchant = ""
                    amount = ""
                    category = "Other"
                    error = ""

                    onExpenseAdded()
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            shape = RoundedCornerShape(18.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = Accent
            )
        ) {

            Text(
                text = "Save Expense",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
fun AiScreen(
    expenses: List<Expense>
) {

    var merchant by remember {
        mutableStateOf("")
    }

    var result by remember {
        mutableStateOf("")
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp)
    ) {

        Spacer(modifier = Modifier.height(20.dp))

        Text(
            text = "AI Categorization",
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold,
            color = TextPrimary
        )

        Text(
            text = "Multinomial Naive Bayes",
            color = Accent2,
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(22.dp))

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(22.dp),
            colors = CardDefaults.cardColors(
                containerColor = CardColor
            )
        ) {

            Column(
                modifier = Modifier.padding(20.dp)
            ) {

                Text(
                    text = "Test the classifier",
                    color = TextPrimary,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )

                Spacer(modifier = Modifier.height(14.dp))

                OutlinedTextField(
                    value = merchant,
                    onValueChange = {
                        merchant = it
                    },
                    modifier = Modifier.fillMaxWidth(),
                    label = {
                        Text("Merchant")
                    },
                    placeholder = {
                        Text("e.g. Swiggy")
                    },
                    singleLine = true,
                    shape = RoundedCornerShape(16.dp)
                )

                Spacer(modifier = Modifier.height(14.dp))

                Button(
                    onClick = {

                        if (merchant.trim().isNotEmpty()) {

                            result =
                                NaiveBayesClassifier.classify(
                                    merchant.trim()
                                )
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Accent
                    )
                ) {

                    Text("Run Naive Bayes")
                }

                if (result.isNotEmpty()) {

                    Spacer(modifier = Modifier.height(18.dp))

                    Text(
                        text = "Predicted Category",
                        fontSize = 12.sp,
                        color = TextSecondary
                    )

                    Text(
                        text = result,
                        fontSize = 25.sp,
                        fontWeight = FontWeight.Bold,
                        color = Green
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(18.dp))

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(22.dp),
            colors = CardDefaults.cardColors(
                containerColor = CardColor
            )
        ) {

            Column(
                modifier = Modifier.padding(20.dp)
            ) {

                Text(
                    text = "How it works",
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "The Naive Bayes model learns merchant/category relationships from the training data and predicts the most probable category for a new merchant.",
                    fontSize = 13.sp,
                    lineHeight = 20.sp,
                    color = TextSecondary
                )
            }
        }
    }
}

@Composable
fun PredictionScreen(
    monthlyTotals: List<Double>
) {

    val prediction =
        LinearRegressionPredictor.predict(monthlyTotals)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp)
    ) {

        Spacer(modifier = Modifier.height(20.dp))

        Text(
            text = "AI Prediction",
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold,
            color = TextPrimary
        )

        Text(
            text = "Linear Regression",
            color = Accent2,
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(20.dp))

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(26.dp),
            colors = CardDefaults.cardColors(
                containerColor = CardColor
            )
        ) {

            Column(
                modifier = Modifier.padding(22.dp)
            ) {

                Text(
                    text = "Predicted Next Month",
                    color = TextSecondary,
                    fontSize = 13.sp
                )

                Spacer(modifier = Modifier.height(8.dp))

                if (prediction != null) {

                    Text(
                        text = "₹${prediction.toInt()}",
                        fontSize = 36.sp,
                        fontWeight = FontWeight.Bold,
                        color = Green
                    )

                } else {

                    Text(
                        text = "Not enough data",
                        fontSize = 25.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        Text(
            text = "Monthly Spending Data",
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold,
            color = TextPrimary
        )

        Spacer(modifier = Modifier.height(10.dp))

        if (monthlyTotals.isEmpty()) {

            Text(
                text = "No monthly data available yet.",
                color = TextSecondary
            )

        } else {

            monthlyTotals.forEachIndexed { index, value ->

                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 8.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = CardColor
                    )
                ) {

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement =
                            Arrangement.SpaceBetween
                    ) {

                        Text(
                            text = "Month ${index + 1}",
                            color = TextSecondary
                        )

                        Text(
                            text = "₹${value.toInt()}",
                            color = TextPrimary,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun BottomNavigationBar(
    currentPage: AppPage,
    onPageSelected: (AppPage) -> Unit
) {

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .navigationBarsPadding(),
        color = Color(0xFF0D1119)
    ) {

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(
                    horizontal = 8.dp,
                    vertical = 10.dp
                ),
            horizontalArrangement =
                Arrangement.SpaceEvenly
        ) {

            NavigationItem(
                title = "Home",
                selected = currentPage == AppPage.HOME,
                onClick = {
                    onPageSelected(AppPage.HOME)
                }
            )

            NavigationItem(
                title = "Transactions",
                selected =
                    currentPage == AppPage.TRANSACTIONS,
                onClick = {
                    onPageSelected(AppPage.TRANSACTIONS)
                }
            )

            NavigationItem(
                title = "+ Add",
                selected =
                    currentPage == AppPage.ADD_EXPENSE,
                onClick = {
                    onPageSelected(AppPage.ADD_EXPENSE)
                }
            )
        }
    }
}

@Composable
fun NavigationItem(
    title: String,
    selected: Boolean,
    onClick: () -> Unit
) {

    Column(
        modifier = Modifier
            .clip(RoundedCornerShape(15.dp))
            .clickable {
                onClick()
            }
            .padding(
                horizontal = 10.dp,
                vertical = 8.dp
            ),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {

        Text(
            text = title,
            fontSize = 11.sp,
            fontWeight =
                if (selected)
                    FontWeight.Bold
                else
                    FontWeight.Normal,
            color =
                if (selected)
                    Accent2
                else
                    TextSecondary
        )
    }
}

fun categoryEmoji(category: String): String {

    return when (category.lowercase()) {

        "food" -> "🍔"
        "travel" -> "🚕"
        "shopping" -> "🛍️"
        "entertainment" -> "🎬"
        "groceries" -> "🛒"
        "healthcare" -> "💊"
        "bills" -> "📄"

        else -> "💰"
    }
}