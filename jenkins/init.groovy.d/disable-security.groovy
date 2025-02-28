import jenkins.model.*
import hudson.security.*

// Get Jenkins instance
def jenkins = Jenkins.getInstance()

// Disable security
def strategy = new hudson.security.AuthorizationStrategy.Unsecured()
jenkins.setAuthorizationStrategy(strategy)

def realm = new HudsonPrivateSecurityRealm(false)
jenkins.setSecurityRealm(realm)

// Save configuration
jenkins.save()

println "Security has been disabled"
