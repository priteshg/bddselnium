stage('Run Jest BDD tests') {
  steps {
    script {
      sh '''
        set -e
        npx jest --showConfig | grep -i -E "testRunner|retryTimes" || true
        npx jest --ci --runInBand --retryTimes=0 --coverage --maxWorkers=50
      '''
    }
  }
}