  const grid = `
@@@@@@@@@@@@@
@           @
@           @
@           @
@     @     @
@     @     @
@     @     @
@     @     @
@     @     @
@  #  @  X  @
@     @     @
@@@@@@@@@@@@@
`

/*
DEF UPN
  DUP
  IF
    UP
    PUSH 1
    SUB
    UPN
  ELSE
    POP
  END
END

DEF MOVEN
  DUP
  IF
    SWAP
    DUP
    MOVE
    SWAP
    PUSH 1
    SUB
    MOVEN
  ELSE
    POP
    POP
  END
END

PUSH 7
UPN

PUSH 2
PUSH 6
MOVEN

PUSH 3
PUSH 5
MOVEN
*/

  window.game = Game.createFromGrid({
    grid,
    mapping: {
      '@': 'block',
      '#': 'player',
      'X': 'goal',
    },
    allFunctionsAvailable: true,
    objects: [
      {
        name: 'goal',
        getSymbol: () => 'o',
        getColor: () => 'cyan',
      },
    ],
  });

