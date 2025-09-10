export function roundUp(number: number): number {
    let roundedUp: number = number
    const floored = Math.floor(number)
    if (floored < number) {
        roundedUp = floored + 1
    } else roundedUp = floored
    return roundedUp
}