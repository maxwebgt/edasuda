
    import jenkins.model.*
    import hudson.security.*
    def jenkins = Jenkins.getInstance()
    def strategy = new hudson.security.AuthorizationStrategy.Unsecured()
    jenkins.setAuthorizationStrategy(strategy)
    def realm = new HudsonPrivateSecurityRealm(false)
    jenkins.setSecurityRealm(realm)
    jenkins.save()
    println "Security has been disabled"
  
