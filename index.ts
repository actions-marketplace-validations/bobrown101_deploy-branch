import * as core from '@actions/core'
// import {execSync} from 'child_process'
import {logError, logSuccess, logInfo} from './log'
import {execSync} from 'child_process'

const deployLocation = '/tmp/deploy-branch-temp'

const requireEnvVar = (envVar: string): string => {
  const requested = process.env[envVar]
  if (requested) {
    return requested
  } else {
    const msg = `The enviornment variable "${envVar}" does not exist. It is required to run deploy-branch`
    logError(msg)
    core.setFailed(msg)
    process.exit(1)
  }
}

const runCommand = (cmd: string, errorMsg?: string): void => {
  try {
    console.log(execSync(cmd).toString())
  } catch (error) {
    console.error(error)
    const msg = errorMsg || error.toString()
    logError(msg)
    core.setFailed(msg)
    process.exit(1)
  }
}

const requireInput = (input: string): string => {
  const requested = core.getInput(input)
  if (requested) {
    return requested
  } else {
    const msg = `The input variable "${input}" does not exist. It is required to run deploy-branch`
    logError(msg)
    core.setFailed(msg)
    process.exit(1)
  }
}

// const deployZEIT = (branch: string): void => {
//   console.log(JSON.stringify(process.env, null, 4))
//   const token = requireEnvVar('INPUT_NOW-TOKEN')
//   try {
//     console.log(execSync(`git checkout remotes/origin/${branch}`).toString())
//     execSync(`npx now --token ${token}`)
//   } catch (error) {
//     failWithError('Could not deploy to zeit', error)
//   }
// }

const deployNetlify = (): void => {
  logInfo('Deploying to netlify...')
  const token = requireEnvVar('INPUT_NETLIFY-AUTH-TOKEN')
  const siteID = requireInput('netlify-site-id')
  process.env['NETLIFY_AUTH_TOKEN'] = token
  process.env['NETLIFY_SITE_ID'] = siteID
  runCommand(`cd ${deployLocation} && ls -al && npx netlify-cli deploy --dir .`)
  // TODO - --dir . is deploying cov files too
  // comment deploy link somewhere for user
  // make site publish (probably just as simple as adding --prod)
}

async function run(): Promise<void> {
  try {
    const repo = requireEnvVar('GITHUB_REPOSITORY')
    const remoteRepo = `https://github.com/${repo}.git`

    const branch = requireInput('branch')
    const provider = requireInput('provider')

    runCommand(`mkdir -p ${deployLocation}`)
    runCommand(
      `cd ${deployLocation} && git clone --depth=1 ${remoteRepo} ${branch}`,
      `Could not checkout branch ${branch}. Are you sure it exists?`
    )

    if (provider === 'NETLIFY') {
      deployNetlify()
    } else {
      logError(`Provider ${provider} is currently not supported`)
    }

    const msg = `Successfully deployed branch!`
    logSuccess(msg)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
