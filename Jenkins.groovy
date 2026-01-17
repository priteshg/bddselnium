stage('Jest (stability)') {
  steps {
    script {
      withEnv(['JEST_RETRIES=0']) {
        catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
          sh 'npm test -- --coverage --maxWorkers=50'
        }
      }
    }
  }
}