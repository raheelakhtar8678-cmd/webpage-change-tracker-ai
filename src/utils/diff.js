import { diffLines } from 'diff';

export function calculateDiff(oldText, newText) {
    const diffs = diffLines(oldText || '', newText || '');
    return diffs
        .filter(d => d.added || d.removed)
        .map(d => ({
            type: d.added ? 'added' : 'removed',
            text: d.value.slice(0, 800)
        }));
}