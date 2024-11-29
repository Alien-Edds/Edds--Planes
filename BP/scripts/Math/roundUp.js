export function roundUp(number) {
    let roundedUp = number;
    const floored = Math.floor(number);
    if (floored < number) {
        roundedUp = floored + 1;
    }
    else
        roundedUp = floored;
    return roundedUp;
}
