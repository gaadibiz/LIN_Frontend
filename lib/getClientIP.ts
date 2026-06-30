export const getClientIp = async (): Promise<string> => {
    try {
        const endpoints = [
            "https://api4.ipify.org?format=json",
            "https://api64.ipify.org?format=json",
            "https://api.ipify.org?format=json",
        ];

        for (const url of endpoints) {
            try {
                // Add a 2.5s timeout using AbortController to prevent hanging connections
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2500);

                const response = await fetch(url, {
                    cache: "no-store",
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (!response.ok) continue;

                const data = await response.json();

                if (data?.ip) {
                    console.log("Client IP:", data.ip);
                    return data.ip;
                }
            } catch (err) {
                console.warn(`Failed to fetch from ${url}`, err);
            }
        }

        return "";
    } catch (err) {
        console.error("Unable to get client IP", err);
        return "";
    }
};