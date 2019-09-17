export class Player {
    id: number;
    name: string;
    otherItems: any;

    static players: Player[] = [
        { id: 1, name: 'Roserade', otherItems: { 'コード': '0000-1111-2222', 'タイプ': 'Grass/Poison' } },
        { id: 2, name: 'Absol', otherItems: { 'コード': '0000-1111-2222', 'タイプ': 'Dark' } },
        { id: 3, name: 'Froslass', otherItems: { 'コード': '0000-1111-2222', 'タイプ': 'Ice/Ghost' } },
        { id: 4, name: 'Lucario', otherItems: { 'コード': '0000-1111-2222', 'タイプ': 'Fighting/Steel' } },
        { id: 5, name: 'Genger', otherItems: { 'コード': '0000-1111-2222', 'タイプ': 'Ghost/Poison' } },
        { id: 6, name: 'Garchomp', otherItems: { 'コード': '0000-1111-2222', 'タイプ': 'Dragon/Ground' } }
    ]
}