script {
          withEnv(['JEST_RETRIES=0']) {
            sh '''
              set -e
              node -e "console.log('JEST_RETRIES=', process.env.JEST_RETRIES)"
              npm test
            '''
          }
        }
      }