import {Sandbox} from "@e2b/code-interpreter"

export async function getSandbox (sandboxid : string){
    const sandbox = await Sandbox.connect(sandboxid)
    return sandbox;
}
