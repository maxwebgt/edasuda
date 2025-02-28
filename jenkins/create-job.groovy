import jenkins.model.*
import hudson.model.*
import org.jenkinsci.plugins.workflow.job.WorkflowJob
import org.jenkinsci.plugins.workflow.cps.CpsScmFlowDefinition
import hudson.plugins.git.*
import hudson.triggers.SCMTrigger

// Create Projects folder
def folderName = "Projects"
def jenkins = Jenkins.getInstance()
def folder = jenkins.getItem(folderName)

if (folder == null) {
    folder = jenkins.createProject(hudson.plugins.nested_view.NestedView.class, folderName)
    println "Created folder: ${folderName}"
}

// Create pipeline job
def jobName = "edasuda-pipeline"
def job = folder.getItem(jobName)

if (job == null) {
    // Create the job
    job = folder.createProject(WorkflowJob.class, jobName)
    job.setDescription("Pipeline for edasuda2 project")
    
    // Set up Git SCM
    def scmSource = new GitSCM("https://github.com/maxwebgt/edasuda.git")
    scmSource.branches = [new BranchSpec("*/main")]
    
    // Add credentials if needed
    def credentialsId = "github-credentials"
    def userRemoteConfig = new UserRemoteConfig("https://github.com/maxwebgt/edasuda.git", "origin", null, credentialsId)
    scmSource.userRemoteConfigs = [userRemoteConfig]
    
    // Create the pipeline definition
    def pipelineDefinition = new CpsScmFlowDefinition(scmSource, "Jenkinsfile")
    pipelineDefinition.setLightweight(true)
    job.setDefinition(pipelineDefinition)
    
    // Add SCM trigger (poll every 5 minutes)
    job.addTrigger(new SCMTrigger("H/5 * * * *"))
    
    job.save()
    println "Created job: ${folderName}/${jobName}"
} else {
    println "Job already exists: ${folderName}/${jobName}"
}

// Save changes
jenkins.save()
println "Done!"
