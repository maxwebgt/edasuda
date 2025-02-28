import jenkins.model.Jenkins
import hudson.FilePath

def instance = Jenkins.getInstance()

// Создаем директорию Projects с правильными разрешениями
def projectsDir = new FilePath(new File("/var/jenkins_home/workspace/Projects"))
if (!projectsDir.exists()) {
    projectsDir.mkdirs()
    // Устанавливаем разрешения
    projectsDir.chmod(0777)
}

// Убедимся, что Jenkins может писать в эту директорию
def testFile = new FilePath(new File("/var/jenkins_home/workspace/Projects/test.txt"))
try {
    testFile.write("Test write permissions", "UTF-8")
    testFile.delete()
    println "Разрешения на запись в директорию Projects установлены правильно"
} catch (Exception e) {
    println "Ошибка при проверке разрешений: " + e.getMessage()
}

// Сохраняем изменения
instance.save()
