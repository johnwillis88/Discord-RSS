// Handle file operations and to accomodate communications between the RSS module and
// the commands module.

const fs = require('fs')
const storage = require('./storage.js')
const currentGuilds = storage.currentGuilds
const config = require('../config.json')

function updateContent (guildId, inFile) {
  try { fs.writeFileSync(`./sources/${guildId}.json`, JSON.stringify(inFile, null, 2)) } catch (e) { console.log(`Guild Profile Warning: Unable to update file ${guildId}.json (${e})`) }
}

exports.updateFile = function (guildId, inFile) { // "inFile" is the new contents in memory
  if (fs.existsSync(`./sources/${guildId}.json`)) {
    fs.readFile(`./sources/${guildId}.json`, function (err, data) {
      if (err) throw err
      if (config.feedManagement.enableBackups === true) try { fs.writeFileSync(`./sources/backup/${guildId}.json`, data) } catch (e) { console.log(`Guild Profile Warning: Unable to backup file ${guildId}.json (${e})`) }
      updateContent(guildId, inFile)
    })
  } else updateContent(guildId, inFile)
}

exports.deleteGuild = function (guildId, callback) {
  try {
    fs.unlinkSync(`./sources/${guildId}.json`)
    fs.unlinkSync(`./sources/backup/${guildId}.json`)
    callback()
  } catch (e) {}
  delete currentGuilds.delete(guildId)
}

exports.isEmptySources = function (guildRss) { // Used on the beginning of each cycle to check for empty sources per guild
  if (!guildRss.sources || guildRss.sources.size() === 0) {
    if (!guildRss.timezone) { // Delete only if server-specific special settings are not found
      exports.deleteGuild(guildRss.id, `../sources/${guildRss.id}.json`, function () {
        console.log(`RSS Info: (${guildRss.id}) => 0 sources found with no custom settings, deleting.`)
      })
    } else console.log(`RSS Info: (${guildRss.id}) => 0 sources found, skipping.`)
    return true
  } else return false
}

exports.checkBackup = function (err, guildId) {
  if (config.feedManagement.enableRestores !== true) return console.log(`Guild Profile Warning: Cannot load guild profile ${guildId} (${err}). Restores disabled, skipping profile..`)

  console.log(`Guild Profile Warning: Cannot load guild profile ${guildId} (${err}). Restores enabled, attempting to restore backup.`)

  fs.readFile(`./sources/backup/${guildId}`, function (err, backup) {
    if (err) return console.log(`Guild Profile Warning: Unable to restore backup for ${guildId}. (${err})`)
    updateContent(guildId, backup, `../sources/${guildId}.json`)
    console.log(`Guild Profile Info: Successfully restored backup for ${guildId}`)
  })
}
