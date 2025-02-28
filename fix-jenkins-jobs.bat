@echo off
echo Running Jenkins job fix script

REM The Jenkins script console command
echo "import jenkins.model.*
import hudson.model.*
import hudson.plugins.git.*
import org.jenkinsci.plugins.workflow.job.*
import org.jenkinsci.plugins.workflow.cps.*
import com.cloudbees.hudson.plugins.folder.*
import hudson.triggers.SCMTrigger

def jenkins = Jenkins.getInstance()

// Create Projects folder if it doesn't exist
def folderName = 'Projects'
def folder = jenkins.getItem(folderName)
if (folder == null) {
    folder = jenkins.createProject(Folder.class, folderName)
    println('Created folder: ' + folderName)
}

// Create pipeline job
def jobName = 'edasuda-pipeline'
def fullJobName = folderName + '/' + jobName
def job = jenkins.getItemByFullName(fullJobName)

if (job == null) {
    job = folder.createProject(WorkflowJob.class, jobName)
    job.setDescription('Pipeline for edasuda2 project')
    
    // Configure Git SCM
    def scm = new GitSCM('https://github.com/maxwebgt/edasuda.git')
    scm.branches = [new BranchSpec('*/main')]
    
    def userRemoteConfig = new UserRemoteConfig('https://github.com/maxwebgt/edasuda.git', 'origin', null, 'github-credentials')
    scm.userRemoteConfigs = [userRemoteConfig]
    
    // Define pipeline from SCM
    def flowDefinition = new CpsScmFlowDefinition(scm, 'Jenkinsfile')
    flowDefinition.setLightweight(true)
    job.setDefinition(flowDefinition)
    
    // Add SCM trigger (poll every 5 minutes)
    job.addTrigger(new SCMTrigger('H/5 * * * *'))
    
    // Save configuration
    job.save()
    println('Created pipeline job: ' + fullJobName)
}

jenkins.save()
println('Done!')" > jenkins_script.groovy

REM Use curl to execute the script in Jenkins
curl -u admin:%JENKINS_ADMIN_PASSWORD% -d "script=<jenkins_script.groovy" http://localhost:8082/scriptText

echo.
echo Script completed. Check the output above for results.
del jenkins_script.groovy
