import jenkins.model.*
import com.cloudbees.plugins.credentials.*
import com.cloudbees.plugins.credentials.domains.*
import com.cloudbees.plugins.credentials.impl.*
import hudson.util.Secret

// Get Jenkins instance
def instance = Jenkins.getInstance()

// Get credentials domain
def domain = Domain.global()

// Get credentials store
def store = instance.getExtensionList(
    "com.cloudbees.plugins.credentials.SystemCredentialsProvider"
)[0].getStore()

// Add GitHub credentials
def githubUsername = System.getenv("GITHUB_USERNAME") ?: "maxwebgt"
def githubToken = System.getenv("GITHUB_TOKEN") ?: "default-token-placeholder"

def githubCredentials = new UsernamePasswordCredentialsImpl(
    CredentialsScope.GLOBAL,
    "github-credentials", 
    "GitHub Credentials",
    githubUsername,
    githubToken
)

// Add GitHub credentials
def existingGithubCreds = store.getCredentials(domain).find { it.id == "github-credentials" }
if (existingGithubCreds) {
    store.updateCredentials(domain, existingGithubCreds, githubCredentials)
    println "Updated GitHub credentials"
} else {
    store.addCredentials(domain, githubCredentials)
    println "Added GitHub credentials"
}

// Add Telegram Bot Token
def telegramToken = System.getenv("TELEGRAM_BOT_TOKEN") ?: "default-token-placeholder"

def telegramCredentials = new UsernamePasswordCredentialsImpl(
    CredentialsScope.GLOBAL,
    "telegram-bot-token",
    "Telegram Bot Token",
    "telegram", // Username doesn't matter
    telegramToken
)

// Add Telegram credentials
def existingTelegramCreds = store.getCredentials(domain).find { it.id == "telegram-bot-token" }
if (existingTelegramCreds) {
    store.updateCredentials(domain, existingTelegramCreds, telegramCredentials)
    println "Updated Telegram token credentials"
} else {
    store.addCredentials(domain, telegramCredentials)
    println "Added Telegram token credentials"
}

// Add MongoDB URI
def mongoUri = System.getenv("MONGO_URI") ?: "mongodb://root:example@mongo:27017/admin"

def mongoCredentials = new UsernamePasswordCredentialsImpl(
    CredentialsScope.GLOBAL,
    "mongo-uri",
    "MongoDB Connection URI",
    "mongo", // Username doesn't matter
    mongoUri
)

// Add MongoDB credentials
def existingMongoCreds = store.getCredentials(domain).find { it.id == "mongo-uri" }
if (existingMongoCreds) {
    store.updateCredentials(domain, existingMongoCreds, mongoCredentials)
    println "Updated MongoDB URI credentials"
} else {
    store.addCredentials(domain, mongoCredentials)
    println "Added MongoDB URI credentials"
}

instance.save()
println "All credentials have been set up"
