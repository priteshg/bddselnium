stage('Run Jest BDD tests') {
  steps {
    script {
      withEnv(['JEST_RETRIES=0']) {
        sh '''
          set -e
          node -e "console.log('JEST_RETRIES=', process.env.JEST_RETRIES)"
          npx jest --showConfig | grep -i -E "testRunner|retryTimes" || true
          npm test -- --coverage --runInBand --maxWorkers=50
        '''
      }
    }
  }
}