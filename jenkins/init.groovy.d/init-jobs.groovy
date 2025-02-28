import jenkins.model.*
import hudson.model.*
import org.jenkinsci.plugins.workflow.job.*
import org.jenkinsci.plugins.workflow.cps.*
import com.cloudbees.hudson.plugins.folder.*
import hudson.plugins.git.*
import hudson.triggers.*

// Get Jenkins instance
def jenkins = Jenkins.getInstance()

// Create Projects folder if it doesn't exist
def folderName = "Projects"
def folder = jenkins.getItem(folderName)
if (folder == null) {
    folder = jenkins.createProject(Folder.class, folderName)
}

// Create pipeline job
def jobName = "edasuda-pipeline"
def fullJobName = "${folderName}/${jobName}"
def job = jenkins.getItemByFullName(fullJobName)

if (job == null) {
    job = folder.createProject(WorkflowJob.class, jobName)
    job.setDescription("Pipeline for edasuda2 project")
    
    // Configure Git SCM
    def scm = new GitSCM("https://github.com/maxwebgt/edasuda.git")
    scm.branches = [new BranchSpec("*/main")]
    
    // Configure credentials if we have them in environment
    def credentialsId = System.getenv("GITHUB_CREDENTIALS_ID")
    if (credentialsId != null && !credentialsId.isEmpty()) {
        def userRemoteConfig = new UserRemoteConfig("https://github.com/maxwebgt/edasuda.git", 
            "origin", null, credentialsId)
        scm.userRemoteConfigs = [userRemoteConfig]
    }

    // Define pipeline from SCM
    def flowDefinition = new CpsScmFlowDefinition(scm, "Jenkinsfile")
    flowDefinition.setLightweight(true)
    job.setDefinition(flowDefinition)

    // Add SCM trigger (poll every 5 minutes)
    job.addTrigger(new SCMTrigger("H/5 * * * *"))

    // Save configuration
    job.save()
    println "Created pipeline job: ${fullJobName}"
}
