import { NextResponse } from 'next/server'

const GITHUB_OWNER = 'nirram77-lang'
const GITHUB_REPO = 'here-4-iguana'
const WORKFLOW_NAME = 'tests.yml'

interface GitHubWorkflowRun {
  id: number
  run_number: number
  status: string
  conclusion: string | null
  created_at: string
  updated_at: string
  head_sha: string
  head_branch: string
  event: string
  run_started_at: string
  jobs_url: string
}

interface GitHubJob {
  id: number
  name: string
  status: string
  conclusion: string | null
  started_at: string
  completed_at: string
  steps: Array<{
    name: string
    status: string
    conclusion: string | null
  }>
}

export async function GET() {
  try {
    // Fetch workflow runs from GitHub API (public repo - no token needed)
    const runsResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${WORKFLOW_NAME}/runs?per_page=10`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'I4IGUANA-Dashboard'
        },
        next: { revalidate: 30 } // Cache for 30 seconds
      }
    )

    if (!runsResponse.ok) {
      console.error('GitHub API error:', runsResponse.status)
      return NextResponse.json({ 
        error: 'Failed to fetch from GitHub',
        status: runsResponse.status 
      }, { status: 500 })
    }

    const runsData = await runsResponse.json()
    const runs: GitHubWorkflowRun[] = runsData.workflow_runs || []

    // Transform GitHub data to our format
    const testResults = await Promise.all(
      runs.slice(0, 10).map(async (run) => {
        // Fetch jobs for this run to get detailed results
        let jobs: GitHubJob[] = []
        try {
          const jobsResponse = await fetch(run.jobs_url, {
            headers: {
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'I4IGUANA-Dashboard'
            }
          })
          if (jobsResponse.ok) {
            const jobsData = await jobsResponse.json()
            jobs = jobsData.jobs || []
          }
        } catch (e) {
          console.error('Error fetching jobs:', e)
        }

        // Find specific job results
        const findJob = (name: string) => jobs.find(j => j.name.toLowerCase().includes(name.toLowerCase()))
        
        const healthCheckJob = findJob('Health Check')
        const buildTestJob = findJob('Build Test')
        const apiTestsJob = findJob('API Tests')
        const performanceJob = findJob('Performance')
        const securityJob = findJob('Security')

        // Calculate duration
        const startTime = new Date(run.run_started_at || run.created_at)
        const endTime = new Date(run.updated_at)
        const durationSecs = Math.round((endTime.getTime() - startTime.getTime()) / 1000)
        const duration = durationSecs > 60 
          ? `${Math.floor(durationSecs / 60)}m ${durationSecs % 60}s`
          : `${durationSecs}s`

        return {
          id: run.id.toString(),
          runNumber: run.run_number,
          timestamp: run.created_at,
          trigger: run.event,
          branch: run.head_branch,
          commit: run.head_sha.substring(0, 7),
          overall: run.conclusion === 'success' ? 'passed' : 
                   run.conclusion === 'failure' ? 'failed' : 
                   run.status === 'in_progress' ? 'running' : 'unknown',
          duration: duration,
          status: run.status,
          conclusion: run.conclusion,
          tests: {
            healthCheck: { 
              status: healthCheckJob?.conclusion || 'unknown',
              website: healthCheckJob?.conclusion === 'success' ? '200' : 'N/A',
              app: healthCheckJob?.conclusion === 'success' ? '200' : 'N/A'
            },
            buildTest: { 
              status: buildTestJob?.conclusion || 'skipped',
              buildTime: 'N/A'
            },
            apiTests: { 
              status: apiTestsJob?.conclusion || 'unknown'
            },
            performanceTests: { 
              status: performanceJob?.conclusion || 'unknown',
              websiteTime: 'N/A',
              appTime: 'N/A'
            },
            securityCheck: { 
              status: securityJob?.conclusion || 'unknown'
            }
          },
          url: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/actions/runs/${run.id}`
        }
      })
    )

    return NextResponse.json({
      success: true,
      results: testResults,
      fetchedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching GitHub tests:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
