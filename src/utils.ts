import http from 'http'
import https from 'https'
import { join } from 'path'
import fs from 'fs'
import { Config } from './config'
import { ctx } from './Context'

function isPortFree(port: number) {
  return new Promise((resolve) => {
    const server = http.createServer()
      .listen(port, () => {
        server.close()
        resolve(true)
      })
      .on('error', () => {
        resolve(false)
      })
  })
}

export function timeout(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function tryPort(start = 4000): Promise<number> {
  if (await isPortFree(start))
    return start
  return tryPort(start + 1)
}

export function ping(url: string) {
  const promise = new Promise<boolean>((resolve) => {
    const useHttps = url.indexOf('https') === 0
    const mod = useHttps ? https.request : http.request

    const pingRequest = mod(url, () => {
      resolve(true)
      pingRequest.destroy()
    })

    pingRequest.on('error', () => {
      resolve(false)
      pingRequest.destroy()
    })

    pingRequest.write('')
    pingRequest.end()
  })
  return promise
}

export async function waitFor(url: string, interval = 200, max = 30_000) {
  let times = Math.ceil(max / interval)

  while (times > 0) {
    times -= 1
    if (await ping(url))
      return true
    await timeout(interval)
  }

  return false
}

export function isViteProject() {
  return fs.existsSync(join(Config.root, 'vite.config.ts'))
  || fs.existsSync(join(Config.root, 'vite.config.js'))
  || (Config.vitepress && hasDependencies('vitepress'))
}

export function loadPackageJSON() {
  const path = join(Config.root, 'package.json')
  if (fs.existsSync(path))
    return JSON.parse(fs.readFileSync(path, 'utf-8'))
}

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function getName(str: 'vite' | 'vitepress') {
  if (str === 'vitepress')
    return 'VitePress'
  return 'Vite'
}

export function hasDependencies(name: string) {
  return Boolean(
    ctx.packageJSON?.dependencies?.[name]
    || ctx.packageJSON?.devDependencies?.[name],
  )
}

export function hasNodeModules() {
  return fs.existsSync(join(Config.root, 'node_modules'))
}

export function getNi() {
  if (fs.existsSync(join(Config.root, 'pnpm-lock.yaml')))
    return 'pnpm install'
  else if (fs.existsSync(join(Config.root, 'yarn.lock')))
    return 'yarn install'
  return 'npm install'
}
