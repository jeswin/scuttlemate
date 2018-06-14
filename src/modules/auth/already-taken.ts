export default async function alreadyTaken(
  identityName: string,
  pubkey: string,
  command: string
) {
  return {
    message: `The username ${identityName} already exists. Choose something else.`
  };
}
