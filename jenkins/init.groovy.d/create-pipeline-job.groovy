import jenkins.model.*
import hudson.model.*
import com.cloudbees.hudson.plugins.folder.*
import org.jenkinsci.plugins.workflow.job.WorkflowJob
import org.jenkinsci.plugins.workflow.cps.CpsScmFlowDefinition
import hudson.plugins.git.*
import hudson.triggers.SCMTrigger

// Script to create the edasuda pipeline job
def jenkins = Jenkins.getInstance()

// Variables from environment
def repositoryUrl = System.getenv('REPOSITORY_URL') ?: 'https://github.com/maxwebgt/edasuda.git'
def credentialsId = "github-credentials"
def branch = "*/main"
def jobName = "edasuda-pipeline"
def folderName = "Projects"

// Create or get the Projects folder
def folder = jenkins.getItem(folderName)
if (folder == null) {
    folder = jenkins.createProject(Folder.class, folderName)
    println "Created folder ${folderName}"
}

// Check if the job already exists
def job = folder.getItem(jobName)
if (job == null) {
    // Create a new pipeline job
    job = folder.createProject(WorkflowJob.class, jobName)
    job.setDescription("Pipeline for edasuda2 project")
    
    // Configure Git SCM
    def scmSource = new GitSCM(repositoryUrl)
    scmSource.branches = [new BranchSpec(branch)]
    
    // Add credentials configuration
    def userRemoteConfig = new UserRemoteConfig(repositoryUrl, "origin", null, credentialsId)
    scmSource.userRemoteConfigs = [userRemoteConfig]
    
    // Create pipeline definition
    def flowDefinition = new CpsScmFlowDefinition(scmSource, "Jenkinsfile")
    flowDefinition.setLightweight(true) 
    job.setDefinition(flowDefinition)
    
    // Configure SCM polling trigger
    job.addTrigger(new SCMTrigger("H/5 * * * *"))
    
    println "Created pipeline job: ${folderName}/${jobName}"
    
    // Save the job
    job.save()
} else {
    println "Job ${folderName}/${jobName} already exists"
}

// Save Jenkins configuration
jenkins.save()
