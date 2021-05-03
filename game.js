const piece_size = 50;

let htmlBoard = [];
let board = [];
let playerTurn = false;
let running = false;
let blockStatusUpdate = false;

function endTurn()
{
    updateHtmlBoard();

    if(scoreBoard(board, 'x') !== undefined)
    {
        running = false;
        updateStatus();
    }
}

function addPieces(td)
{
    td.innerHTML = `
    <svg id="x" viewBox="0 0 ${piece_size} ${piece_size}" style="visibility: hidden; display: none;">
        <path d="M${piece_size} 0 L0 ${piece_size} M0 0 L${piece_size} ${piece_size} Z"/>
    </svg>
    
    <svg id="o" viewBox="0 0 ${piece_size} ${piece_size}" style="visibility: hidden; display: none;">
        <circle cx="${piece_size / 2}" cy="${piece_size / 2}" r="${piece_size / 2 - 5}"/>
    </svg>`;
}

function updateHtmlBoard()
{
    const parseStyle = v => v ? 'visibility: visible;' : 'visibility: none; display:none';

    for(let y = 0; y < 3; ++y)
    {
        for(let x = 0; x < 3; ++x)
        {
            let elem = htmlBoard[y * 3 + x];
            let v = board[y * 3 + x];

            elem.children[0].style = parseStyle(v === 'x')
            elem.children[1].style = parseStyle(v === 'o');
        }
    }
}

async function onClick(row, col)
{
    if(!running || !playerTurn) return;

    if(board[row * 3 + col] === '')
    {
        playerTurn = false;

        board[row * 3 + col] = 'o';
        endTurn();

        await xMove();
    }
}

function onHover()
{
    blockStatusUpdate = true;
    document.getElementById('status').style.cursor = 'pointer';
    setStatus("Play Again?");
}

function onLeaveHover()
{
    blockStatusUpdate = false;
    document.getElementById('status').style.cursor = 'auto';
    updateStatus();
}

function init()
{
    let table = document.getElementById('board');

    for(let y = 0; y < 3; ++y)
    {
        let row = table.appendChild(document.createElement('tr'));

        for(let x = 0; x < 3; ++x)
        {
            let td = htmlBoard[y * 3 + x] = row.appendChild(document.createElement('td'));
            addPieces(td);

            td.onclick = () => onClick(y, x);
        }
    }
}

async function reset()
{
    running = true;
    playerTurn = Math.floor(Math.random() * 2) === 0;

    for(let i = 0; i < 9; ++i)
    {
        board[i] = '';
    }

    updateHtmlBoard();
    updateStatus();

    if(!playerTurn)
    {
        await xMove();
    }
}

function scoreBoard(vBoard, targetPlayer)
{
    let pair = (a, b, c) =>
    {
        if(vBoard[a] === vBoard[b] && vBoard[a] === vBoard[c] && vBoard[a] !== '')
        {
            return vBoard[a];
        }

        return undefined;
    }

    let end = true;
    for(let i = 0; i < 9; ++i)
    {
        if(vBoard[i] === '')
        {
            end = false;
            break;
        }
    }

    let win = pair(0, 1, 2)
        || pair(3, 4, 5)
        || pair(6, 7, 8)
        || pair(0, 3, 6)
        || pair(1, 4, 7)
        || pair(2, 5, 8)
        || pair(0, 4, 8)
        || pair(2, 4, 6);

    if(win)
    {
        return win === targetPlayer ? 1 : -1;
    }
    else if(end)
    {
        return 0;
    }

    return undefined;
}

function findValidMoves(vBoard)
{
    let moves = [];

    for(let i = 0; i < 9; ++i)
    {
        if(vBoard[i] === '')
        {
            moves.push(i);
        }
    }

    return moves;
}

async function minimax()
{
    let vBoard = [];
    Object.assign(vBoard, board);

    let tree = {};
    tree.myTurn = true;
    tree.moves = {};

    await minimaxBuild(vBoard, tree);
    await minimaxFill(tree);

    return tree.next;
}

async function minimaxBuild(vBoard, leaf)
{
    let moves = findValidMoves(vBoard);

    for(let i = 0; i < moves.length; ++i)
    {
        let myLeaf = leaf.moves[moves[i]] = {
            myTurn: !leaf.myTurn,
            moves: {}
        };

        vBoard[moves[i]] = leaf.myTurn ? 'x' : 'o';

        let score = scoreBoard(vBoard, 'x');
        if(score === undefined)
        {
            await minimaxBuild(vBoard, myLeaf);
        }
        else
        {
            leaf.moves[moves[i]].score = score;
        }

        vBoard[moves[i]] = '';
    }
}

async function minimaxFill(leaf)
{
    let scores = [];
    for(let key in leaf.moves)
    {
        let l = leaf.moves[key];

        if(!l.hasOwnProperty('score'))
        {
            await minimaxFill(l);
        }

        scores.push(l.score);
    }

    let fn = leaf.myTurn ? Math.max : Math.min;
    leaf.score = fn(...scores);

    for(let key in leaf.moves)
    {
        if(leaf.moves[key].score === leaf.score)
        {
            leaf.next = key;
            break;
        }
    }
}

async function xMove()
{
    if(!running || playerTurn) return;
    updateStatus();

    board[await minimax()] = 'x';
    endTurn();

    playerTurn = true;
    updateStatus();
}

function updateStatus()
{
    if(blockStatusUpdate) return;

    let score = scoreBoard(board, 'x');
    if(score !== undefined)
    {
        switch(score)
        {
            case -1:
                setStatus("You won!");
                break;
            case 0:
                setStatus("It's a Tie");
                break;
            case 1:
                setStatus("You Lost!");
                break;
        }
    }
    else if(playerTurn)
    {
        setStatus("Your Turn");
    }
    else if(!playerTurn)
    {
        setStatus("Thinking...");
    }
}

function setStatus(text)
{
    document.getElementById('status').innerHTML = text;
}

window.onload = async () =>
{
    setStatus("Setting Up...");
    init();

    await reset();
}