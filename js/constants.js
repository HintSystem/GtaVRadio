export const localDataPath = "data/"
export const remoteDataPath = "https://raw.githubusercontent.com/RegalTerritory/GTA-V-Radio-Stations/master/"

let lastUsedPath = localDataPath;

export async function loadRadioMeta() {
    try {
        const localResponse = await fetch(localDataPath + "radio.json")
        if (!localResponse.ok) throw new Error("Local file not found")

        return await localResponse.json()
    } catch (localError) {
        console.warn("Local radio meta not found, trying remote...", localError)

        try {
            const remoteResponse = await fetch(remoteDataPath + "radio.json")
            if (!remoteResponse.ok) throw new Error("Remote file not found")

            lastUsedPath = dataURL
            return await remoteResponse.json()
        } catch (remoteError) {
            console.error("Failed to load radio meta from both sources.", remoteError)
            throw remoteError
        }
    }
}

export const radioMeta = loadRadioMeta()

export function getDataPath() {
    return lastUsedPath
}