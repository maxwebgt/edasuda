import jenkins.model.*
import hudson.security.*
import jenkins.security.s2m.AdminWhitelistRule
import hudson.security.csrf.DefaultCrumbIssuer

def instance = Jenkins.getInstance()

// Security setup - Create admin user if not exists
def hudsonRealm = new HudsonPrivateSecurityRealm(false)
def adminUsername = System.getenv('JENKINS_ADMIN_USER') ?: 'admin'
def adminPassword = System.getenv('JENKINS_ADMIN_PASSWORD') ?: 'adminpass'

// Create the admin user (if it doesn't already exist)
if (hudsonRealm.getAllUsers().find {it.id == adminUsername} == null) {
    println "Creating admin user: ${adminUsername}"
    hudsonRealm.createAccount(adminUsername, adminPassword)
}

instance.setSecurityRealm(hudsonRealm)

// Authorization strategy - logged in users can do anything
def strategy = new FullControlOnceLoggedInAuthorizationStrategy()
strategy.setAllowAnonymousRead(false)
instance.setAuthorizationStrategy(strategy)

// CSRF protection
instance.setCrumbIssuer(new DefaultCrumbIssuer(true))

// Removed problematic code for agent protocols

// Safely disable CLI over Remoting if descriptor exists
def cliDescriptor = instance.getDescriptor("jenkins.CLI")
if (cliDescriptor != null) {
    try {
        cliDescriptor.get().setEnabled(false)
    } catch (Exception e) {
        println "Could not disable CLI: ${e.message}"
    }
}

// Save configuration
instance.save()

println "Initial security setup complete"
