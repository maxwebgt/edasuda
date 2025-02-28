folder('Projects')

pipelineJob('Projects/edasuda-pipeline') {
    displayName('Edasuda CI/CD Pipeline')
    description('Main pipeline for building and deploying the edasuda2 project')
    
    logRotator {
        numToKeep(10)
        artifactNumToKeep(5)
    }
    
    definition {
        cpsScmFlowDefinition {
            scriptPath('Jenkinsfile')
            scm {
                git {
                    remote {
                        url('https://github.com/maxwebgt/edasuda.git')
                        credentials('github-credentials')
                    }
                    branches('*/main')
                    extensions {
                        cleanBeforeCheckout()
                        cloneOptions {
                            shallow(true)
                            depth(1)
                            timeout(5)
                        }
                    }
                }
            }
            lightweight(true)
        }
    }
    
    triggers {
        scm('H/5 * * * *')
    }
    
    properties {
        disableConcurrentBuilds()
        buildDiscarder {
            strategy {
                logRotator {
                    numToKeepStr('10')
                    artifactNumToKeepStr('5')
                }
            }
        }
    }
}
