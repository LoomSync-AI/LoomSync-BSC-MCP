import { tokens } from "../data/tokens.js"

function getTokenAddressFromName(tokenName) {
    const name = tokenName.toLocaleLowerCase();

    const tokenFound = tokens.find(token => 
        token.name.toLocaleLowerCase().includes(name) || 
        token.symbol.toLocaleLowerCase().includes(name)
    );

    if (tokenFound) {
        return JSON.stringify({
            tokenName,
            tokenAddress: tokenFound.address
        });
    }

    return null;
}

export default getTokenAddressFromName
