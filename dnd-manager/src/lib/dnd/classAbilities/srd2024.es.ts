import { ClassProgression } from "./types";

export const CLASS_PROGRESSIONS_2024_ES: Record<string, ClassProgression> = {
  barbarian: {
    classId: "barbarian",
    className: "Bárbaro",
    source: "Reglas gratuitas de D&D 2024",
    subclassUnlockLevel: 3,
    classFeatures: [
      {
        id: "barbarian:lvl1:rage:1",
        name: "Furia",
        class: "barbarian",
        level: 1,
        description: "Puedes imbuirte de un poder primordial llamado Rabia, una fuerza que te otorga poder y resistencia extraordinarios. Puedes ingresarlo como acción adicional si no llevas armadura pesada.\n\nPuedes ingresar tu Furia la cantidad de veces que se muestra para tu nivel de Bárbaro en la columna Furias de la tabla de Características de Bárbaro. Recuperas un uso gastado cuando terminas un Descanso Corto y recuperas todos los usos gastados cuando terminas un Descanso Largo.\n\nMientras está activo, tu Rage sigue las reglas siguientes.\n\nResistencia al daño. Tienes resistencia al daño contundente, perforante y cortante.\n\nDaño de ira. Cuando realizas un ataque usando Fuerza (ya sea con un arma o un Golpe desarmado) y le infliges daño al objetivo, obtienes una bonificación al daño que aumenta a medida que ganas niveles como Bárbaro, como se muestra en la columna Daño de ira de la tabla Características del Bárbaro.\n\nVentaja de fuerza. Tienes ventaja en las pruebas de Fuerza y ​​en las tiradas de salvación de Fuerza.\n\nSin concentración ni hechizos. No puedes mantener la concentración y no puedes lanzar hechizos.\n\nDuración. La ira dura hasta el final de tu siguiente turno y termina antes si te pones una armadura pesada o tienes la condición de Incapacitado. Si tu ira todavía está activa en tu próximo turno, puedes extenderla por otra ronda haciendo una de las siguientes cosas:\n\nCada vez que se extiende la Rabia, dura hasta el final de tu siguiente turno. Puedes mantener la ira por hasta 10 minutos."
      },
      {
        id: "barbarian:lvl1:unarmored-defense:2",
        name: "Defensa sin armadura",
        class: "barbarian",
        level: 1,
        description: "Si bien no llevas ninguna armadura, tu Clase de Armadura base es igual a 10 más tus modificadores de Destreza y Constitución. Puedes usar un escudo y aun así obtener este beneficio."
      },
      {
        id: "barbarian:lvl1:weapon-mastery:3",
        name: "Dominio de armas",
        class: "barbarian",
        level: 1,
        description: "Tu entrenamiento con armas te permite utilizar las propiedades de dominio de dos tipos de armas cuerpo a cuerpo simples o marciales de tu elección, como Greataxes y Handaxes. Cada vez que termines un descanso prolongado, podrás practicar ejercicios con armas y cambiar una de esas opciones de armas.\n\nCuando alcanzas ciertos niveles de Bárbaro, obtienes la capacidad de usar las propiedades de dominio de más tipos de armas, como se muestra en la columna Dominio de armas de la tabla Características de Bárbaro."
      },
      {
        id: "barbarian:lvl2:danger-sense:1",
        name: "Sentido de peligro",
        class: "barbarian",
        level: 2,
        description: "Obtienes una extraña sensación de cuándo las cosas no son como deberían ser, lo que te da una ventaja cuando esquivas peligros. Tienes ventaja en las tiradas de salvación de Destreza a menos que tengas la condición de Incapacitado."
      },
      {
        id: "barbarian:lvl2:reckless-attack:2",
        name: "Ataque imprudente",
        class: "barbarian",
        level: 2,
        description: "Puedes dejar de lado toda preocupación por la defensa para atacar con mayor ferocidad. Cuando haces tu primera tirada de ataque en tu turno, puedes decidir atacar imprudentemente. Hacerlo te da Ventaja en las tiradas de ataque usando Fuerza hasta el comienzo de tu siguiente turno, pero las tiradas de ataque contra ti tienen Ventaja durante ese tiempo."
      },
      {
        id: "barbarian:lvl3:barbarian-subclass:1",
        name: "Subclase bárbara",
        class: "barbarian",
        level: 3,
        description: "Obtienes una subclase de bárbaro de tu elección. La subclase Path of the Berserker se detalla después de la descripción de esta clase. Una subclase es una especialización que te otorga características en ciertos niveles de Bárbaro. Durante el resto de tu carrera, obtienes cada una de las características de tu subclase que sean de tu nivel Bárbaro o inferior."
      },
      {
        id: "barbarian:lvl3:primal-knowledge:2",
        name: "Conocimiento primordial",
        class: "barbarian",
        level: 3,
        description: "Obtienes competencia en otra habilidad de tu elección de la lista de habilidades disponibles para los Bárbaros en el nivel 1.\n\nAdemás, mientras tu Rabia está activa, puedes canalizar el poder primario cuando intentas ciertas tareas; Siempre que hagas una prueba de habilidad usando una de las siguientes habilidades, puedes hacerlo como una prueba de Fuerza incluso si normalmente usa una habilidad diferente: Acrobacia, Intimidación, Percepción, Sigilo o Supervivencia. Cuando usas esta habilidad, tu Fuerza representa el poder primordial que corre a través de ti, perfeccionando tu agilidad, porte y sentidos."
      },
      {
        id: "barbarian:lvl4:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "barbarian",
        level: 4,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de Bárbaro 8, 12 y 16."
      },
      {
        id: "barbarian:lvl5:extra-attack:1",
        name: "Ataque extra",
        class: "barbarian",
        level: 5,
        description: "Puedes atacar dos veces en lugar de una cada vez que realizas la acción de Atacar en tu turno."
      },
      {
        id: "barbarian:lvl5:fast-movement:2",
        name: "Movimiento rápido",
        class: "barbarian",
        level: 5,
        description: "Tu velocidad aumenta 10 pies mientras no llevas armadura pesada."
      },
      {
        id: "barbarian:lvl6:subclass-feature:1",
        name: "Característica de subclase",
        class: "barbarian",
        level: 6
      },
      {
        id: "barbarian:lvl7:feral-instinct:1",
        name: "Instinto salvaje",
        class: "barbarian",
        level: 7,
        description: "Tus instintos están tan afinados que tienes Ventaja en las tiradas de Iniciativa."
      },
      {
        id: "barbarian:lvl7:instinctive-pounce:2",
        name: "Salto instintivo",
        class: "barbarian",
        level: 7,
        description: "Como parte de la acción adicional que realizas para entrar en ira, puedes moverte hasta la mitad de tu velocidad."
      },
      {
        id: "barbarian:lvl8:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "barbarian",
        level: 8,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de Bárbaro 8, 12 y 16."
      },
      {
        id: "barbarian:lvl9:brutal-strike:1",
        name: "Golpe brutal",
        class: "barbarian",
        level: 9,
        description: "Si usas Ataque Temerario, puedes renunciar a cualquier Ventaja en una tirada de ataque basada en Fuerza de tu elección en tu turno. La tirada de ataque elegida no debe tener Desventaja. Si la tirada de ataque elegida acierta, el objetivo recibe 1d10 de daño adicional del mismo tipo infligido por el arma o el Golpe desarmado, y puedes provocar un efecto de Golpe brutal de tu elección. Tienes las siguientes opciones de efectos.\n\nGolpe contundente. El objetivo es empujado a 15 pies de distancia de usted. Luego podrás moverte hasta la mitad de tu velocidad directamente hacia el objetivo sin provocar ataques de oportunidad.\n\nGolpe en el tendón de la corva. La velocidad del objetivo se reduce en 15 pies hasta el comienzo de tu siguiente turno. Un objetivo sólo puede verse afectado por un golpe en el tendón de la corva a la vez: el más reciente."
      },
      {
        id: "barbarian:lvl10:subclass-feature:1",
        name: "Característica de subclase",
        class: "barbarian",
        level: 10
      },
      {
        id: "barbarian:lvl11:relentless-rage:1",
        name: "Rabia implacable",
        class: "barbarian",
        level: 11,
        description: "Tu ira puede hacerte seguir luchando a pesar de las heridas graves. Si bajas a 0 puntos de vida mientras tu ira está activa y no mueres directamente, puedes realizar una tirada de salvación de Constitución CD 10. Si tienes éxito, tus puntos de vida cambiarán a un número igual al doble de tu nivel de bárbaro.\n\nCada vez que usas esta función después de la primera, la CD aumenta en 5. Cuando terminas un descanso corto o largo, la CD se restablece a 10."
      },
      {
        id: "barbarian:lvl12:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "barbarian",
        level: 12,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de Bárbaro 8, 12 y 16."
      },
      {
        id: "barbarian:lvl13:improved-brutal-strike:1",
        name: "Golpe brutal mejorado",
        class: "barbarian",
        level: 13,
        description: "Has perfeccionado nuevas formas de atacar furiosamente. Los siguientes efectos ahora se encuentran entre tus opciones de Golpe Brutal.\n\nGolpe asombroso. El objetivo tiene Desventaja en la siguiente tirada de salvación que realiza y no puede realizar Ataques de Oportunidad hasta el comienzo de tu siguiente turno.\n\nGolpe desgarrador. Antes del comienzo de tu siguiente turno, la siguiente tirada de ataque realizada por otra criatura contra el objetivo obtiene una bonificación de +5 a la tirada. Una tirada de ataque sólo puede obtener una bonificación de Golpe desgarrador."
      },
      {
        id: "barbarian:lvl14:subclass-feature:1",
        name: "Característica de subclase",
        class: "barbarian",
        level: 14
      },
      {
        id: "barbarian:lvl15:persistent-rage:1",
        name: "Rabia persistente",
        class: "barbarian",
        level: 15,
        description: "Cuando tiras Iniciativa, puedes recuperar todos los usos gastados de Rabia. Después de recuperar usos de Rabia de esta manera, no podrás volver a hacerlo hasta que termines un Descanso prolongado.\n\nAdemás, tu Rabia es tan feroz que ahora dura 10 minutos sin que tengas que hacer nada para extenderla de una ronda a otra. Tu ira termina antes si tienes la condición Inconsciente (no solo la condición Incapacitado) o te pones una armadura pesada."
      },
      {
        id: "barbarian:lvl16:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "barbarian",
        level: 16,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de Bárbaro 8, 12 y 16."
      },
      {
        id: "barbarian:lvl17:improved-brutal-strike:1",
        name: "Golpe brutal mejorado",
        class: "barbarian",
        level: 17,
        description: "El daño extra de tu Golpe Brutal aumenta a 2d10. Además, puedes usar dos efectos Brutal Strike diferentes cada vez que uses tu función Brutal Strike."
      },
      {
        id: "barbarian:lvl18:indomitable-might:1",
        name: "Poder indomable",
        class: "barbarian",
        level: 18,
        description: "Si tu total para una prueba de Fuerza o una tirada de salvación de Fuerza es menor que tu puntuación de Fuerza, puedes usar esa puntuación en lugar del total."
      },
      {
        id: "barbarian:lvl19:epic-boon:1",
        name: "Bendición épica",
        class: "barbarian",
        level: 19,
        description: "Obtienes una dote de bendición épica (ver “Dotes”) u otra dote de tu elección para la cual calificas. Se recomienda la bendición de la ofensiva irresistible."
      },
      {
        id: "barbarian:lvl20:primal-champion:1",
        name: "Campeón primigenio",
        class: "barbarian",
        level: 20,
        description: "Encarnas el poder primordial. Tus puntuaciones de Fuerza y ​​Constitución aumentan en 4, hasta un máximo de 25."
      }
    ],
    subclasses: [
      {
        id: "barbarian:path-of-the-berserker",
        name: "El camino del berserker",
        classId: "barbarian",
        unlockLevel: 3,
        source: "Reglas gratuitas de D&D 2024",
        features: [
          {
            id: "barbarian:path-of-the-berserker:lvl3:frenzy",
            name: "Frenesí",
            class: "barbarian",
            level: 3,
            subclassId: "barbarian:path-of-the-berserker",
            subclassName: "El camino del berserker",
            description: "Si usas Ataque imprudente mientras tu Rabia está activa, infliges daño adicional al primer objetivo que golpees en tu turno con un ataque basado en Fuerza. Para determinar el daño adicional, tira una cantidad de d6 igual a tu bonificación de daño de ira y súmalos. El daño es del mismo tipo que el arma o Golpe Desarmado utilizado para el ataque."
          },
          {
            id: "barbarian:path-of-the-berserker:lvl6:mindless-rage",
            name: "Rabia sin sentido",
            class: "barbarian",
            level: 6,
            subclassId: "barbarian:path-of-the-berserker",
            subclassName: "El camino del berserker",
            description: "Tienes inmunidad a las condiciones Encantado y Asustado mientras tu Rabia está activa. Si estás encantado o asustado cuando entras en ira, la condición termina contigo."
          },
          {
            id: "barbarian:path-of-the-berserker:lvl10:retaliation",
            name: "Represalias",
            class: "barbarian",
            level: 10,
            subclassId: "barbarian:path-of-the-berserker",
            subclassName: "El camino del berserker",
            description: "Cuando recibes daño de una criatura que está a 5 pies de ti, puedes reaccionar para realizar un ataque cuerpo a cuerpo contra esa criatura, usando un arma o un Golpe desarmado."
          },
          {
            id: "barbarian:path-of-the-berserker:lvl14:intimidating-presence",
            name: "Presencia intimidante",
            class: "barbarian",
            level: 14,
            subclassId: "barbarian:path-of-the-berserker",
            subclassName: "El camino del berserker",
            description: "Como acción adicional, puedes infundir terror en los demás con tu presencia amenazadora y tu poder primordial. Cuando lo hagas, cada criatura de tu elección en una Emanación de 30 pies que se origine en ti debe realizar una tirada de salvación de Sabiduría (CD 8 más tu modificador de Fuerza y ​​Bonificación de Competencia). Si falla la salvación, la criatura tiene la condición Asustada durante 1 minuto. Al final de cada uno de los turnos de la criatura Asustada, la criatura repite la salvación, finalizando el efecto sobre sí misma si tiene éxito.\n\nUna vez que uses esta función, no podrás volver a usarla hasta que termines un descanso prolongado a menos que gastes un uso de tu ira (no se requiere ninguna acción) para restaurar tu uso."
          }
        ]
      }
    ]
  },
  bard: {
    classId: "bard",
    className: "Bardo",
    source: "Reglas gratuitas de D&D 2024",
    subclassUnlockLevel: 3,
    classFeatures: [
      {
        id: "bard:lvl1:bardic-inspiration:1",
        name: "Inspiración bárdica",
        class: "bard",
        level: 1,
        description: "Puedes inspirar a otros de forma sobrenatural a través de palabras, música o danza. Esta inspiración está representada por tu dado Bardic Inspiration, que es un d6.\n\nUsando la inspiración bárdica. Como acción adicional, puedes inspirar a otra criatura a 60 pies de ti que pueda verte u oírte. Esa criatura gana uno de tus dados de Inspiración Bárdica. Una criatura sólo puede tener un dado de Inspiración Bárdica a la vez.\n\nUna vez dentro de la siguiente hora, cuando la criatura falla una prueba D20, la criatura puede tirar el dado de Inspiración Bárdica y sumar el número obtenido al d20, lo que potencialmente convierte el fracaso en un éxito. Un dado de Inspiración Bárdica se gasta cuando se tira.\n\nNúmero de usos. Puedes conferir un dado de Inspiración Bárdica un número de veces igual a tu modificador de Carisma (mínimo una vez) y recuperas todos los usos gastados cuando terminas un Descanso Largo.\n\nEn niveles superiores. Tu dado de Bardic Inspiration cambia cuando alcanzas ciertos niveles de Bardo, como se muestra en la columna Bardic Die de la tabla de Características de Bardo. El dado se convierte en un d8 en el nivel 5, un d10 en el nivel 10 y un d12 en el nivel 15."
      },
      {
        id: "bard:lvl1:spellcasting:2",
        name: "Lanzamiento de hechizos",
        class: "bard",
        level: 1,
        description: "Has aprendido a lanzar hechizos a través de tus artes de bardo. Consulta \"Hechizos\" para conocer las reglas sobre el lanzamiento de hechizos. La siguiente información detalla cómo se usan esas reglas con los hechizos de Bardo, que aparecen en la lista de hechizos de Bardo más adelante en la descripción de la clase.\n\nTrucos. Conoces dos trucos de tu elección de la lista de hechizos de Bardo. Se recomiendan Luces danzantes y Burla viciosa.\n\nSiempre que ganes un nivel de Bardo, puedes reemplazar uno de tus trucos con otro truco de tu elección de la lista de hechizos de Bardo.\n\nCuando alcanzas los niveles 4 y 10 de Bardo, aprendes otro truco de tu elección de la lista de hechizos de Bardo, como se muestra en la columna Trucos de la tabla Características de Bardo.\n\nRanuras para hechizos. La tabla de características del bardo muestra cuántos espacios para hechizos tienes para lanzar tus hechizos de nivel 1+. Recuperas todos los espacios gastados cuando terminas un descanso prolongado.\n\nHechizos preparados de nivel 1+. Usted prepara la lista de hechizos de nivel 1+ que están disponibles para lanzar con esta función. Para empezar, elige cuatro hechizos de nivel 1 de la lista de hechizos de Bardo. Se recomiendan Encantar persona, Spray de color, Susurros disonantes y Palabra curativa.\n\nLa cantidad de hechizos en tu lista aumenta a medida que ganas niveles de Bardo, como se muestra en la columna Hechizos preparados de la tabla Características de Bardo. Siempre que ese número aumente, elige hechizos adicionales de la lista de hechizos de Bardo hasta que el número de hechizos en tu lista coincida con el número de la tabla. Los hechizos elegidos deben ser de un nivel para el que tengas espacios para hechizos. Por ejemplo, si eres un bardo de nivel 3, tu lista de hechizos preparados puede incluir seis hechizos de niveles 1 y 2 en cualquier combinación.\n\nSi otra característica de Bardo te proporciona hechizos que siempre has preparado, esos hechizos no cuentan para la cantidad de hechizos que puedes preparar con esta característica, pero esos hechizos cuentan como hechizos de Bardo para ti.\n\nCambiando tus hechizos preparados. Siempre que ganes un nivel de Bardo, puedes reemplazar un hechizo de tu lista con otro hechizo de Bardo para el que tengas espacios para hechizos.\n\nHabilidad de lanzar hechizos. El carisma es tu habilidad para lanzar hechizos para tus hechizos de Bardo.\n\nEnfoque de lanzamiento de hechizos. Puedes usar un instrumento musical como foco de lanzamiento de hechizos para tus hechizos de bardo."
      },
      {
        id: "bard:lvl2:expertise:1",
        name: "Pericia",
        class: "bard",
        level: 2,
        description: "Obtienes Experiencia (consulta el glosario de reglas) en dos de tus competencias de habilidad de tu elección. Se recomiendan Performance y Persuasión si los domina.\n\nEn el nivel 9 de Bardo, obtienes Experiencia en dos habilidades más de tu elección."
      },
      {
        id: "bard:lvl2:jack-of-all-trades:2",
        name: "Experto en todos los oficios",
        class: "bard",
        level: 2,
        description: "Puedes agregar la mitad de tu Bonificación de Competencia (redondeando hacia abajo) a cualquier prueba de habilidad que realices y que use una habilidad de la que careces y que de otro modo no use tu Bonificación de Competencia.\n\nPor ejemplo, si realizas una prueba de Fuerza (Atletismo) y no tienes competencia en Atletismo, puedes añadir la mitad de tu Bonificación de Competencia a la prueba.\n\nEl repertorio de un bardo\n\n¿Tu bardo toca un tambor mientras canta las hazañas de los antiguos héroes? 'Rasguea un laúd mientras canta melodías románticas' Interpreta arias de poder conmovedor' Recita monólogos dramáticos de tragedias clásicas' Usa el ritmo de una danza folclórica para coordinar el movimiento de los aliados en la batalla' Compone quintillas traviesas'\n\nCuando interpretes a un Bardo, considera el estilo de interpretación artística que prefieres, los estados de ánimo que podrías invocar y los temas que inspiran tus propias creaciones. ¿Tus poemas están inspirados en momentos de belleza natural o son reflexiones melancólicas sobre la pérdida? ¿Prefieres himnos elevados o canciones ruidosas de taberna? ¿Te atraen los lamentos por los caídos o las celebraciones de la alegría? ¿Bailas alegres jigs o realizas coreografías interpretativas elaboradas? ¿Te concentras en un estilo de actuación o te esfuerzas por dominarlos todos?"
      },
      {
        id: "bard:lvl3:bard-subclass:1",
        name: "Subclase de bardo",
        class: "bard",
        level: 3,
        description: "Obtienes una subclase de Bardo de tu elección. La subclase College of Lore se detalla después de la descripción de esta clase. Una subclase es una especialización que te otorga características en ciertos niveles de Bardo. Durante el resto de tu carrera, obtienes cada una de las características de tu subclase que sean de tu nivel de Bardo o inferior."
      },
      {
        id: "bard:lvl4:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "bard",
        level: 4,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de Bardo 8, 12 y 16."
      },
      {
        id: "bard:lvl5:font-of-inspiration:1",
        name: "Fuente de inspiración",
        class: "bard",
        level: 5,
        description: "Ahora recuperas todos los usos gastados de Bardic Inspiration cuando finalizas un descanso corto o largo.\n\nAdemás, puedes gastar un espacio de hechizo (no se requiere acción) para recuperar un uso gastado de Bardic Inspiration."
      },
      {
        id: "bard:lvl6:subclass-feature:1",
        name: "Característica de subclase",
        class: "bard",
        level: 6
      },
      {
        id: "bard:lvl7:countercharm:1",
        name: "Contraencanto",
        class: "bard",
        level: 7,
        description: "Puede utilizar notas musicales o palabras de poder para interrumpir los efectos que influyen en la mente. Si tú o una criatura a 30 pies de ti falla una tirada de salvación contra un efecto que aplica la condición Encantado o Asustado, puedes tomar una Reacción para hacer que se vuelva a tirar la salvación, y la nueva tirada tiene Ventaja."
      },
      {
        id: "bard:lvl8:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "bard",
        level: 8,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de Bardo 8, 12 y 16."
      },
      {
        id: "bard:lvl9:expertise:1",
        name: "Pericia",
        class: "bard",
        level: 9,
        description: "Obtienes Experiencia (consulta el glosario de reglas) en dos de tus competencias de habilidad de tu elección. Se recomiendan Performance y Persuasión si los domina.\n\nEn el nivel 9 de Bardo, obtienes Experiencia en dos habilidades más de tu elección."
      },
      {
        id: "bard:lvl10:magical-secrets:1",
        name: "Secretos magicos",
        class: "bard",
        level: 10,
        description: "Has aprendido secretos de varias tradiciones mágicas. Siempre que alcances un nivel de Bardo (incluido este nivel) y el número de Hechizos preparados en la tabla de Características de Bardo aumente, puedes elegir cualquiera de tus nuevos hechizos preparados de las listas de hechizos de Bardo, Clérigo, Druida y Mago, y los hechizos elegidos cuentan como hechizos de Bardo para ti (consulta la sección de una clase para ver su lista de hechizos). Además, siempre que reemplaces un hechizo preparado para esta clase, podrás reemplazarlo con un hechizo de esas listas."
      },
      {
        id: "bard:lvl11:feature:1",
        name: "—",
        class: "bard",
        level: 11
      },
      {
        id: "bard:lvl12:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "bard",
        level: 12,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de Bardo 8, 12 y 16."
      },
      {
        id: "bard:lvl13:feature:1",
        name: "—",
        class: "bard",
        level: 13
      },
      {
        id: "bard:lvl14:subclass-feature:1",
        name: "Característica de subclase",
        class: "bard",
        level: 14
      },
      {
        id: "bard:lvl15:feature:1",
        name: "—",
        class: "bard",
        level: 15
      },
      {
        id: "bard:lvl16:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "bard",
        level: 16,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de Bardo 8, 12 y 16."
      },
      {
        id: "bard:lvl17:feature:1",
        name: "—",
        class: "bard",
        level: 17
      },
      {
        id: "bard:lvl18:superior-inspiration:1",
        name: "Inspiración superior",
        class: "bard",
        level: 18,
        description: "Cuando tiras Iniciativa, recuperas los usos gastados de Inspiración bárdica hasta que tengas dos si tienes menos que eso."
      },
      {
        id: "bard:lvl19:epic-boon:1",
        name: "Bendición épica",
        class: "bard",
        level: 19,
        description: "Obtienes una dote de bendición épica (ver “Dotes”) u otra dote de tu elección para la cual calificas. Se recomienda la bendición de recordar hechizos."
      },
      {
        id: "bard:lvl20:words-of-creation:1",
        name: "Palabras de creación",
        class: "bard",
        level: 20,
        description: "Has dominado dos de las Palabras de la Creación: las palabras de vida y muerte. Por lo tanto, siempre tendrás preparados los hechizos Power Word Heal y Power Word Kill. Cuando lanzas cualquiera de los hechizos, puedes apuntar a una segunda criatura con él si esa criatura está a 10 pies del primer objetivo."
      }
    ],
    subclasses: [
      {
        id: "bard:college-of-lore",
        name: "colegio de tradiciones",
        classId: "bard",
        unlockLevel: 3,
        source: "Reglas gratuitas de D&D 2024",
        features: [
          {
            id: "bard:college-of-lore:lvl3:bonus-proficiencies",
            name: "Competencias adicionales",
            class: "bard",
            level: 3,
            subclassId: "bard:college-of-lore",
            subclassName: "colegio de tradiciones",
            description: "Obtienes competencia con tres habilidades de tu elección."
          },
          {
            id: "bard:college-of-lore:lvl3:cutting-words",
            name: "Cortar palabras",
            class: "bard",
            level: 3,
            subclassId: "bard:college-of-lore",
            subclassName: "colegio de tradiciones",
            description: "Aprendes a usar tu ingenio para distraer, confundir y minar de otro modo sobrenaturalmente la confianza y la competencia de los demás. Cuando una criatura que puedes ver a 60 pies de ti hace una tirada de daño o tiene éxito en una prueba de habilidad o tirada de ataque, puedes tomar una Reacción para gastar un uso de tu Inspiración Bárdica; Tira tu dado de Inspiración Bárdica y resta el número obtenido de la tirada de la criatura, reduciendo el daño o potencialmente convirtiendo el éxito en un fracaso."
          },
          {
            id: "bard:college-of-lore:lvl6:magical-discoveries",
            name: "Descubrimientos mágicos",
            class: "bard",
            level: 6,
            subclassId: "bard:college-of-lore",
            subclassName: "colegio de tradiciones",
            description: "Aprendes dos hechizos de tu elección. Estos hechizos pueden provenir de la lista de hechizos de Clérigo, Druida o Mago o cualquier combinación de los mismos (consulte la sección de una clase para ver su lista de hechizos). El hechizo que elijas debe ser un truco o un hechizo para el que tengas espacios para hechizos, como se muestra en la tabla de Características del bardo.\n\nSiempre tienes preparados los hechizos elegidos, y cada vez que ganes un nivel de Bardo, podrás reemplazar uno de los hechizos por otro que cumpla con estos requisitos."
          },
          {
            id: "bard:college-of-lore:lvl14:peerless-skill",
            name: "Habilidad incomparable",
            class: "bard",
            level: 14,
            subclassId: "bard:college-of-lore",
            subclassName: "colegio de tradiciones",
            description: "Cuando haces una prueba de habilidad o una tirada de ataque y fallas, puedes gastar un uso de Bardic Inspiration; Tira el dado de Inspiración Bárdica y suma el número obtenido al d20, lo que potencialmente convierte un fracaso en un éxito. En caso de fallo, la inspiración bárdica no se gasta."
          }
        ]
      }
    ]
  },
  cleric: {
    classId: "cleric",
    className: "Clérigo",
    source: "Reglas gratuitas de D&D 2024",
    subclassUnlockLevel: 3,
    classFeatures: [
      {
        id: "cleric:lvl1:spellcasting:1",
        name: "Lanzamiento de hechizos",
        class: "cleric",
        level: 1,
        description: "Has aprendido a lanzar hechizos mediante la oración y la meditación. Consulta \"Hechizos\" para conocer las reglas sobre el lanzamiento de hechizos. La siguiente información detalla cómo se usan esas reglas con los hechizos de Clérigo, que aparecen en la lista de hechizos de Clérigo más adelante en la descripción de la clase.\n\nTrucos. Conoces tres trucos de tu elección de la lista de hechizos de Clérigo. Se recomiendan Orientación, Llama Sagrada y Taumaturgia.\n\nSiempre que ganes un nivel de Clérigo, puedes reemplazar uno de tus trucos con otro truco de tu elección de la lista de hechizos de Clérigo.\n\nCuando alcanzas los niveles de Clérigo 4 y 10, aprendes otro truco de tu elección de la lista de hechizos de Clérigo, como se muestra en la columna Trucos de la tabla Características del Clérigo.\n\nRanuras para hechizos. La tabla de características del clérigo muestra cuántos espacios para hechizos tienes para lanzar tus hechizos de nivel 1+. Recuperas todos los espacios gastados cuando terminas un descanso prolongado.\n\nHechizos preparados de nivel 1+. Usted prepara la lista de hechizos de nivel 1+ que están disponibles para lanzar con esta función. Para empezar, elige cuatro hechizos de nivel 1 de la lista de hechizos de Clérigo. Se recomiendan Bendecir, Curar Heridas, Rayo Guía y Escudo de la Fe.\n\nLa cantidad de hechizos en tu lista aumenta a medida que obtienes niveles de clérigo, como se muestra en la columna Hechizos preparados de la tabla Características del clérigo. Siempre que ese número aumente, elige hechizos adicionales de la lista de hechizos de Clérigo hasta que el número de hechizos de tu lista coincida con el número de la tabla. Los hechizos elegidos deben ser de un nivel para el que tengas espacios para hechizos. Por ejemplo, si eres un clérigo de nivel 3, tu lista de hechizos preparados puede incluir seis hechizos de niveles 1 y 2 en cualquier combinación.\n\nSi otra característica de Clérigo te proporciona hechizos que siempre has preparado, esos hechizos no cuentan para la cantidad de hechizos que puedes preparar con esta característica, pero esos hechizos cuentan como hechizos de Clérigo para ti.\n\nCambiando tus hechizos preparados. Siempre que termines un Descanso prolongado, puedes cambiar tu lista de hechizos preparados, reemplazando cualquiera de los hechizos allí con otros hechizos de Clérigo para los que tienes espacios para hechizos.\n\nHabilidad de lanzar hechizos. La sabiduría es tu habilidad para lanzar hechizos para tus hechizos de clérigo.\n\nEnfoque de lanzamiento de hechizos. Puedes usar un símbolo sagrado como foco de lanzamiento de hechizos para tus hechizos de clérigo."
      },
      {
        id: "cleric:lvl1:divine-order:2",
        name: "Orden Divina",
        class: "cleric",
        level: 1,
        description: "Te has dedicado a uno de los siguientes roles sagrados de tu elección.\n\nProtector. Entrenado para la batalla, adquieres competencia con armas marciales y entrenas con armadura pesada.\n\nTaumaturgo. Conoces un truco adicional de la lista de hechizos de Clérigo. Además, tu conexión mística con lo divino te otorga una bonificación a tus pruebas de Inteligencia (Arcanos o Religión). La bonificación es igual a tu modificador de Sabiduría (mínimo de +1)."
      },
      {
        id: "cleric:lvl2:channel-divinity:1",
        name: "Canalizar la Divinidad",
        class: "cleric",
        level: 2,
        description: "Puedes canalizar energía divina directamente desde los planos exteriores para impulsar efectos mágicos. Comienzas con dos de estos efectos: Divine Spark y Turn Undead, cada uno de los cuales se describe a continuación. Cada vez que uses Channel Divinity de esta clase, elige qué efecto de Channel Divinity de esta clase crear. Obtienes opciones de efectos adicionales en niveles de clérigo más altos.\n\nPuedes usar Channel Divinity de esta clase dos veces. Recuperas uno de sus usos gastados cuando terminas un Descanso Corto, y recuperas todos los usos gastados cuando terminas un Descanso Largo. Obtienes usos adicionales cuando alcanzas ciertos niveles de Clérigo, como se muestra en la columna Canalizar Divinidad de la tabla Funciones de Clérigo.\n\nSi un efecto de Canalizar Divinidad requiere una tirada de salvación, la CD es igual a la CD de salvación del hechizo de la función Lanzamiento de hechizos de esta clase.\n\nChispa Divina. Como acción mágica, apuntas con tu Símbolo Sagrado a otra criatura que puedas ver a 30 pies de ti y concentras energía divina en ella. Tira 1d8 y añade tu modificador de Sabiduría. O restauras puntos de vida a la criatura iguales a ese total o obligas a la criatura a realizar una tirada de salvación de Constitución. Si falla la salvación, la criatura sufre daño necrótico o radiante (tú eliges) igual a ese total. Si tiene éxito, la criatura sufre la mitad de daño (redondeando hacia abajo).\n\nTiras un d8 adicional cuando alcanzas los niveles de clérigo 7 (2d8), 13 (3d8) y 18 (4d8).\n\nConviértete en no-muerto. Como acción mágica, presentas tu símbolo sagrado y censuras a las criaturas no muertas. Cada No-muerto de tu elección dentro de 30 pies de ti debe realizar una tirada de salvación de Sabiduría. Si la criatura falla su salvación, tiene las condiciones Asustada e Incapacitada durante 1 minuto. Durante ese tiempo, intenta alejarse lo más posible de ti en sus turnos. Este efecto termina temprano en la criatura si recibe algún daño, si tienes la condición de Incapacitado o si mueres."
      },
      {
        id: "cleric:lvl3:cleric-subclass:1",
        name: "Subclase de clérigo",
        class: "cleric",
        level: 3,
        description: "Obtienes una subclase de clérigo de tu elección. La subclase Dominio de vida se detalla después de la descripción de esta clase. Una subclase es una especialización que te otorga características en ciertos niveles de Clérigo. Durante el resto de tu carrera, obtienes cada una de las características de tu subclase que sean de tu nivel de Clérigo o inferior."
      },
      {
        id: "cleric:lvl4:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "cleric",
        level: 4,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de Clérigo 8, 12 y 16."
      },
      {
        id: "cleric:lvl5:sear-undead:1",
        name: "Sear no-muertos",
        class: "cleric",
        level: 5,
        description: "Siempre que uses Turn Undead, puedes tirar una cantidad de d8 igual a tu modificador de Sabiduría (mínimo de 1d8) y sumar las tiradas. Cada Undead que falla su tirada de salvación contra el uso de Turn Undead recibe un daño Radiante igual al total de la tirada. Este daño no finaliza el efecto de turno."
      },
      {
        id: "cleric:lvl6:subclass-feature:1",
        name: "Característica de subclase",
        class: "cleric",
        level: 6
      },
      {
        id: "cleric:lvl7:blessed-strikes:1",
        name: "Golpes benditos",
        class: "cleric",
        level: 7,
        description: "El poder divino te infunde en la batalla. Obtienes una de las siguientes opciones de tu elección (si obtienes cualquiera de las opciones de una subclase de Clérigo en un libro anterior, usa solo la opción que elijas para esta característica).\n\nGolpe Divino. Una vez en cada uno de tus turnos, cuando golpeas a una criatura con una tirada de ataque usando un arma, puedes hacer que el objetivo reciba 1d8 de daño necrótico o radiante adicional (tú eliges).\n\nPotente lanzamiento de hechizos. Agrega tu modificador de Sabiduría al daño que infliges con cualquier truco de Clérigo."
      },
      {
        id: "cleric:lvl8:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "cleric",
        level: 8,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de Clérigo 8, 12 y 16."
      },
      {
        id: "cleric:lvl9:feature:1",
        name: "—",
        class: "cleric",
        level: 9
      },
      {
        id: "cleric:lvl10:divine-intervention:1",
        name: "Intervención Divina",
        class: "cleric",
        level: 10,
        description: "Puedes invocar a tu deidad o panteón para que intervenga en tu nombre. Como acción mágica, elige cualquier hechizo de clérigo de nivel 5 o inferior que no requiera una reacción para lanzarse. Como parte de la misma acción, lanzas ese hechizo sin gastar un espacio de hechizo ni necesitar componentes materiales. No podrás volver a utilizar esta función hasta que termines un descanso prolongado."
      },
      {
        id: "cleric:lvl11:feature:1",
        name: "—",
        class: "cleric",
        level: 11
      },
      {
        id: "cleric:lvl12:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "cleric",
        level: 12,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de Clérigo 8, 12 y 16."
      },
      {
        id: "cleric:lvl13:feature:1",
        name: "—",
        class: "cleric",
        level: 13
      },
      {
        id: "cleric:lvl14:improved-blessed-strikes:1",
        name: "Golpes benditos mejorados",
        class: "cleric",
        level: 14,
        description: "La opción que elegiste para Blessed Strikes se vuelve más poderosa.\n\nGolpe Divino. El daño extra de tu Golpe Divino aumenta a 2d8.\n\nPotente lanzamiento de hechizos. Cuando lanzas un truco de clérigo y le infliges daño a una criatura con él, puedes darte vitalidad a ti mismo o a otra criatura dentro de un radio de 60 pies de ti, otorgando una cantidad de puntos de vida temporales igual al doble de tu modificador de sabiduría."
      },
      {
        id: "cleric:lvl15:feature:1",
        name: "—",
        class: "cleric",
        level: 15
      },
      {
        id: "cleric:lvl16:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "cleric",
        level: 16,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de Clérigo 8, 12 y 16."
      },
      {
        id: "cleric:lvl17:subclass-feature:1",
        name: "Característica de subclase",
        class: "cleric",
        level: 17
      },
      {
        id: "cleric:lvl18:feature:1",
        name: "—",
        class: "cleric",
        level: 18
      },
      {
        id: "cleric:lvl19:epic-boon:1",
        name: "Bendición épica",
        class: "cleric",
        level: 19,
        description: "Obtienes una dote de bendición épica (ver “Dotes”) u otra dote de tu elección para la cual calificas. Se recomienda la bendición del destino."
      },
      {
        id: "cleric:lvl20:greater-divine-intervention:1",
        name: "Mayor intervención divina",
        class: "cleric",
        level: 20,
        description: "Puedes recurrir a una intervención divina aún más poderosa. Cuando usas tu función de Intervención Divina, puedes elegir Deseo cuando seleccionas un hechizo. Si lo haces, no podrás volver a utilizar la Intervención Divina hasta que termines 2d4 Descansos Largos."
      }
    ],
    subclasses: [
      {
        id: "cleric:life-domain",
        name: "Dominio de la vida",
        classId: "cleric",
        unlockLevel: 3,
        source: "Reglas gratuitas de D&D 2024",
        features: [
          {
            id: "cleric:life-domain:lvl3:disciple-of-life",
            name: "Discípulo de la vida",
            class: "cleric",
            level: 3,
            subclassId: "cleric:life-domain",
            subclassName: "Dominio de la vida",
            description: "Cuando un hechizo que lanzas con un espacio de hechizo restaura puntos de vida a una criatura, esa criatura recupera puntos de vida adicionales en el turno en que lanzas el hechizo. Los puntos de vida adicionales equivalen a 2 más el nivel del espacio del hechizo."
          },
          {
            id: "cleric:life-domain:lvl3:life-domain-spells",
            name: "Hechizos de dominio de vida",
            class: "cleric",
            level: 3,
            subclassId: "cleric:life-domain",
            subclassName: "Dominio de la vida",
            description: "Tu conexión con este dominio divino garantiza que siempre tengas ciertos hechizos listos. Cuando alcanzas un nivel de Clérigo especificado en la tabla de Hechizos del Dominio de la Vida, a partir de entonces siempre tendrás preparados los hechizos enumerados."
          },
          {
            id: "cleric:life-domain:lvl3:preserve-life",
            name: "Preservar la vida",
            class: "cleric",
            level: 3,
            subclassId: "cleric:life-domain",
            subclassName: "Dominio de la vida",
            description: "Como acción mágica, presentas tu Símbolo Sagrado y gastas un uso de tu Canalizar Divinidad para evocar energía curativa que puede restaurar una cantidad de puntos de vida igual a cinco veces tu nivel de Clérigo. Elige criaturas ensangrentadas a 30 pies de ti (que pueden incluirte a ti) y divide esos puntos de vida entre ellas. Esta característica puede restaurar una criatura a no más de la mitad de su máximo de puntos de vida."
          },
          {
            id: "cleric:life-domain:lvl6:blessed-healer",
            name: "Bendito sanador",
            class: "cleric",
            level: 6,
            subclassId: "cleric:life-domain",
            subclassName: "Dominio de la vida",
            description: "Los hechizos curativos que lanzas sobre los demás también te curan a ti. Inmediatamente después de lanzar un hechizo con un espacio de hechizo que restaura los puntos de vida de una o más criaturas distintas a ti, recuperas puntos de vida iguales a 2 más el nivel del espacio de hechizo."
          },
          {
            id: "cleric:life-domain:lvl17:supreme-healing",
            name: "Sanación Suprema",
            class: "cleric",
            level: 17,
            subclassId: "cleric:life-domain",
            subclassName: "Dominio de la vida",
            description: "Cuando normalmente tirarías uno o más dados para restaurar los puntos de vida de una criatura con un hechizo o canalizar divinidad, no tires esos dados para la curación; en su lugar, utilice el número más alto posible para cada dado. Por ejemplo, en lugar de restaurar 2d6 puntos de vida a una criatura con un hechizo, restauras 12."
          }
        ]
      }
    ]
  },
  druid: {
    classId: "druid",
    className: "druida",
    source: "Reglas gratuitas de D&D 2024",
    subclassUnlockLevel: 3,
    classFeatures: [
      {
        id: "druid:lvl1:spellcasting:1",
        name: "Lanzamiento de hechizos",
        class: "druid",
        level: 1,
        description: "Has aprendido a lanzar hechizos estudiando las fuerzas místicas de la naturaleza. Consulta \"Hechizos\" para conocer las reglas sobre el lanzamiento de hechizos. La siguiente información detalla cómo se usan esas reglas con los hechizos de druida, que aparecen en la lista de hechizos de druida más adelante en la descripción de la clase.\n\nTrucos. Conoces dos trucos de tu elección de la lista de hechizos de druida. Se recomiendan Druidcraft y Produce Flame.\n\nSiempre que ganes un nivel de Druida, puedes reemplazar uno de tus trucos con otro truco de tu elección de la lista de hechizos de Druida.\n\nCuando alcanzas los niveles de druida 4 y 10, aprendes otro truco de tu elección de la lista de hechizos del druida, como se muestra en la columna Trucos de la tabla Características del druida.\n\nRanuras para hechizos. La tabla de características del druida muestra cuántos espacios para hechizos tienes para lanzar tus hechizos de nivel 1+. Recuperas todos los espacios gastados cuando terminas un descanso prolongado.\n\nHechizos preparados de nivel 1+. Usted prepara la lista de hechizos de nivel 1+ que están disponibles para lanzar con esta función. Para empezar, elige cuatro hechizos de nivel 1 de la lista de hechizos de druida. Se recomiendan Animal Friendship, Cure Wounds, Faerie Fire y Thunderwave.\n\nLa cantidad de hechizos en tu lista aumenta a medida que ganas niveles de druida, como se muestra en la columna Hechizos preparados de la tabla Características del druida. Siempre que ese número aumente, elige hechizos adicionales de la lista de hechizos del druida hasta que el número de hechizos de tu lista coincida con el número de la tabla. Los hechizos elegidos deben ser de un nivel para el que tengas espacios para hechizos. Por ejemplo, si eres un druida de nivel 3, tu lista de hechizos preparados puede incluir seis hechizos de niveles 1 y 2 en cualquier combinación.\n\nSi otra característica de Druida te proporciona hechizos que siempre has preparado, esos hechizos no cuentan para la cantidad de hechizos que puedes preparar con esta característica, pero esos hechizos cuentan como hechizos de Druida para ti.\n\nCambiando tus hechizos preparados. Siempre que termines un Descanso Largo, puedes cambiar tu lista de hechizos preparados, reemplazando cualquiera de los hechizos con otros hechizos de Druida para los que tengas espacios para hechizos.\n\nHabilidad de lanzar hechizos. La sabiduría es tu habilidad para lanzar hechizos para tus hechizos de druida.\n\nEnfoque de lanzamiento de hechizos. Puedes usar un enfoque druídico como enfoque de lanzamiento de hechizos para tus hechizos druidas."
      },
      {
        id: "druid:lvl1:druidic:2",
        name: "druida",
        class: "druid",
        level: 1,
        description: "Ya conoces el druida, el lenguaje secreto de los druidas. Mientras aprendes esta antigua lengua, también desbloqueas la magia de comunicarte con los animales; siempre tienes preparado el hechizo Habla con los animales.\n\nPuedes usar Druidic para dejar mensajes ocultos. Usted y otras personas que conocen Druidic detectan automáticamente ese mensaje. Otros detectan la presencia del mensaje con una prueba exitosa de Inteligencia (Investigación) CD 15, pero no pueden descifrarlo sin magia."
      },
      {
        id: "druid:lvl1:primal-order:3",
        name: "Orden primigenio",
        class: "druid",
        level: 1,
        description: "Te has dedicado a uno de los siguientes roles sagrados de tu elección.\n\nMago. Conoces un truco adicional de la lista de hechizos de los druidas. Además, tu conexión mística con la naturaleza te otorga una bonificación a tus pruebas de Inteligencia (Arcanos o Naturaleza). La bonificación es igual a tu modificador de Sabiduría (bonificación mínima de +1).\n\nGuardián. Entrenado para la batalla, adquieres competencia con armas marciales y entrenas con armadura media."
      },
      {
        id: "druid:lvl2:wild-shape:1",
        name: "Forma salvaje",
        class: "druid",
        level: 2,
        description: "El poder de la naturaleza te permite asumir la forma de un animal. Como acción adicional, cambias de forma a una forma de Bestia que has aprendido para esta función (ver “Formas conocidas” a continuación). Permaneces en esa forma durante una cantidad de horas igual a la mitad de tu nivel de Druida o hasta que uses Wild Shape nuevamente, tengas la condición de Incapacitado o mueras. También puedes abandonar el formulario antes de tiempo como acción de bonificación.\n\nNúmero de usos. Puedes usar Wild Shape dos veces. Recuperas un uso gastado cuando terminas un Descanso Corto y recuperas todos los usos gastados cuando terminas un Descanso Largo.\n\nObtienes usos adicionales cuando alcanzas ciertos niveles de druida, como se muestra en la columna Forma salvaje de la tabla Características del druida.\n\nFormas conocidas. Conoces cuatro formas de Bestia para esta función, elegidas entre bloques de estadísticas de Bestia que tienen un índice de desafío máximo de 1/4 y que carecen de Velocidad de vuelo (consulta el apéndice B para ver las opciones de bloques de estadísticas). Se recomiendan la Rata, el Caballo de Montar, la Araña y el Lobo. Siempre que finalice un descanso prolongado, puede reemplazar uno de sus formularios conocidos por otro formulario elegible.\n\nCuando alcanzas ciertos niveles de Druida, tu número de formas conocidas y el índice de desafío máximo para esas formas aumentan, como se muestra en la tabla de Formas de Bestias. Además, a partir del nivel 8, puedes adoptar una forma que tenga Velocidad de vuelo.\n\nAl elegir formas conocidas, puedes buscar en el Manual de Monstruos o en otro lugar las Bestias elegibles si el Dungeon Master te lo permite."
      },
      {
        id: "druid:lvl2:wild-companion:2",
        name: "Compañero salvaje",
        class: "druid",
        level: 2,
        description: "Puedes convocar a un espíritu de la naturaleza que asume una forma animal para que te ayude. Como acción mágica, puedes gastar un espacio de hechizo o un uso de Forma salvaje para lanzar el hechizo Buscar familiar sin componentes materiales.\n\nCuando lanzas el hechizo de esta manera, el familiar es Fey y desaparece cuando terminas un Descanso Largo."
      },
      {
        id: "druid:lvl3:druid-subclass:1",
        name: "Subclase de druida",
        class: "druid",
        level: 3,
        description: "Obtienes una subclase de druida de tu elección. La subclase Circle of the Land se detalla después de la descripción de esta clase. Una subclase es una especialización que te otorga características en ciertos niveles de druida. Durante el resto de tu carrera, obtienes cada una de las características de tu subclase que sean de tu nivel de druida o inferior."
      },
      {
        id: "druid:lvl4:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "druid",
        level: 4,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de druida 8, 12 y 16."
      },
      {
        id: "druid:lvl5:wild-resurgence:1",
        name: "Resurgimiento salvaje",
        class: "druid",
        level: 5,
        description: "Una vez en cada uno de tus turnos, si no te quedan usos de Wild Shape, puedes darte un uso gastando un espacio de hechizo (no se requiere ninguna acción).\n\nAdemás, puedes gastar un uso de Forma salvaje (no se requiere acción) para obtener un espacio para hechizos de nivel 1, pero no puedes volver a hacerlo hasta que termines un Descanso prolongado."
      },
      {
        id: "druid:lvl6:subclass-feature:1",
        name: "Característica de subclase",
        class: "druid",
        level: 6
      },
      {
        id: "druid:lvl7:elemental-fury:1",
        name: "Furia elemental",
        class: "druid",
        level: 7,
        description: "El poder de los elementos fluye a través de ti. Obtendrá una de las siguientes opciones de su elección.\n\nPotente lanzamiento de hechizos. Agrega tu modificador de Sabiduría al daño que infliges con cualquier truco de Druida.\n\nGolpe Primordial. Una vez en cada uno de tus turnos, cuando golpeas a una criatura con una tirada de ataque usando un arma o un ataque en forma de Bestia en Forma Salvaje, puedes hacer que el objetivo reciba 1d8 de daño adicional por Frío, Fuego, Rayo o Trueno (elige cuándo golpeas)."
      },
      {
        id: "druid:lvl8:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "druid",
        level: 8,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de druida 8, 12 y 16."
      },
      {
        id: "druid:lvl9:feature:1",
        name: "—",
        class: "druid",
        level: 9
      },
      {
        id: "druid:lvl10:subclass-feature:1",
        name: "Característica de subclase",
        class: "druid",
        level: 10
      },
      {
        id: "druid:lvl11:feature:1",
        name: "—",
        class: "druid",
        level: 11
      },
      {
        id: "druid:lvl12:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "druid",
        level: 12,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de druida 8, 12 y 16."
      },
      {
        id: "druid:lvl13:feature:1",
        name: "—",
        class: "druid",
        level: 13
      },
      {
        id: "druid:lvl14:subclass-feature:1",
        name: "Característica de subclase",
        class: "druid",
        level: 14
      },
      {
        id: "druid:lvl15:improved-elemental-fury:1",
        name: "Furia elemental mejorada",
        class: "druid",
        level: 15,
        description: "La opción que elegiste para Elemental Fury se vuelve más poderosa, como se detalla a continuación.\n\nPotente lanzamiento de hechizos. Cuando lanzas un truco de druida con un alcance de 10 pies o más, el alcance del hechizo aumenta en 300 pies.\n\nGolpe Primordial. El daño extra de tu Golpe Primordial aumenta a 2d8."
      },
      {
        id: "druid:lvl16:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "druid",
        level: 16,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de druida 8, 12 y 16."
      },
      {
        id: "druid:lvl17:feature:1",
        name: "—",
        class: "druid",
        level: 17
      },
      {
        id: "druid:lvl18:beast-spells:1",
        name: "Hechizos de bestias",
        class: "druid",
        level: 18,
        description: "Mientras usas Forma Salvaje, puedes lanzar hechizos en forma de Bestia, excepto cualquier hechizo que tenga un componente Material con un costo especificado o que consuma su componente Material."
      },
      {
        id: "druid:lvl19:epic-boon:1",
        name: "Bendición épica",
        class: "druid",
        level: 19,
        description: "Obtienes una dote de bendición épica (ver “Dotes”) u otra dote de tu elección para la cual calificas. Se recomienda la bendición de los viajes dimensionales."
      },
      {
        id: "druid:lvl20:archdruid:1",
        name: "Archidruida",
        class: "druid",
        level: 20,
        description: "La vitalidad de la naturaleza florece constantemente en tu interior, otorgándote los siguientes beneficios.\n\nForma salvaje de hoja perenne. Siempre que tiras Iniciativa y no te quedan usos de Forma salvaje, recuperas un uso gastado.\n\nMago de la Naturaleza. Puedes convertir usos de Wild Shape en un espacio para hechizos (no se requiere ninguna acción). Elija varios de sus usos no utilizados de Wild Shape y conviértalos en un solo espacio de hechizo, y cada uso contribuirá con 2 niveles de hechizo. Por ejemplo, si conviertes dos usos de Wild Shape, producirás un espacio para hechizos de nivel 4. Una vez que utilices este beneficio, no podrás volver a hacerlo hasta que finalices un Descanso Largo.\n\nLongevidad. La magia primordial que ejerces hace que envejezcas más lentamente. Por cada diez años que pasan, tu cuerpo envejece sólo un año."
      }
    ],
    subclasses: [
      {
        id: "druid:circle-of-the-land",
        name: "Círculo de la tierra",
        classId: "druid",
        unlockLevel: 3,
        source: "Reglas gratuitas de D&D 2024",
        features: [
          {
            id: "druid:circle-of-the-land:lvl3:circle-of-the-land-spells",
            name: "Hechizos del círculo de la tierra",
            class: "druid",
            level: 3,
            subclassId: "druid:circle-of-the-land",
            subclassName: "Círculo de la tierra",
            description: "Cada vez que termines un Descanso Largo, elige un tipo de tierra: árida, polar, templada o tropical. Consulte la tabla a continuación que corresponde al tipo elegido; Tienes preparados los hechizos enumerados para tu nivel de druida e inferiores."
          },
          {
            id: "druid:circle-of-the-land:lvl3:land-s-aid",
            name: "Ayuda a la tierra",
            class: "druid",
            level: 3,
            subclassId: "druid:circle-of-the-land",
            subclassName: "Círculo de la tierra",
            description: "Como acción mágica, puedes gastar un uso de tu forma salvaje y elegir un punto dentro de un radio de 60 pies de ti. Flores que dan vitalidad y espinas que drenan la vida aparecen por un momento en una esfera de 10 pies de radio centrada en ese punto. Cada criatura de tu elección en la Esfera debe realizar una tirada de salvación de Constitución contra la CD de salvación de tu hechizo, recibiendo 2d6 de daño necrótico en una salvación fallida o la mitad de daño en una exitosa. Una criatura de tu elección en esa área recupera 2d6 puntos de vida.\n\nEl daño y la curación aumentan en 1d6 cuando alcanzas los niveles de Druida 10 (3d6) y 14 (4d6)."
          },
          {
            id: "druid:circle-of-the-land:lvl6:natural-recovery",
            name: "Recuperación Natural",
            class: "druid",
            level: 6,
            subclassId: "druid:circle-of-the-land",
            subclassName: "Círculo de la tierra",
            description: "Puedes lanzar uno de los hechizos de nivel 1+ que hayas preparado desde tu función Hechizos circulares sin gastar un espacio de hechizo, y debes terminar un descanso prolongado antes de volver a hacerlo.\n\nAdemás, cuando finalizas un breve descanso, puedes elegir espacios de hechizo gastados para recuperarte. Los espacios para hechizos pueden tener un nivel combinado igual o inferior a la mitad de tu nivel de druida (redondeando hacia arriba), y ninguno de ellos puede ser de nivel 6+. Por ejemplo, si eres un druida de nivel 6, puedes recuperar hasta tres niveles de espacios para hechizos. Puedes recuperar un espacio para hechizos de nivel 3, un espacio para hechizos de nivel 2 y uno de nivel 1, o tres espacios para hechizos de nivel 1. Una vez que recuperes espacios para hechizos con esta función, no podrás volver a hacerlo hasta que termines un Descanso prolongado."
          },
          {
            id: "druid:circle-of-the-land:lvl10:nature-s-ward",
            name: "Protección de la naturaleza",
            class: "druid",
            level: 10,
            subclassId: "druid:circle-of-the-land",
            subclassName: "Círculo de la tierra",
            description: "Eres inmune a la condición de Envenenado y tienes Resistencia a un tipo de daño asociado con tu elección de tierra actual en la función Hechizos circulares, como se muestra en la tabla de Protección de la Naturaleza."
          },
          {
            id: "druid:circle-of-the-land:lvl14:nature-s-sanctuary",
            name: "Santuario de la naturaleza",
            class: "druid",
            level: 14,
            subclassId: "druid:circle-of-the-land",
            subclassName: "Círculo de la tierra",
            description: "Como acción mágica, puedes gastar un uso de tu forma salvaje y hacer que aparezcan árboles y enredaderas espectrales en un cubo de 15 pies en el suelo a 120 pies de ti. Duran allí durante 1 minuto o hasta que tengas la condición de Incapacitado o mueras. Tú y tus aliados tenéis media cobertura mientras estéis en esa zona, y tus aliados obtienen la resistencia actual de tu protección natural mientras estén allí.\n\nComo acción adicional, puedes mover el cubo hasta 60 pies hasta el suelo a 120 pies de ti."
          }
        ]
      }
    ]
  },
  fighter: {
    classId: "fighter",
    className: "Combatiente",
    source: "Reglas gratuitas de D&D 2024",
    subclassUnlockLevel: 3,
    classFeatures: [
      {
        id: "fighter:lvl1:fighting-style:1",
        name: "Estilo de lucha",
        class: "fighter",
        level: 1,
        description: "Has perfeccionado tu destreza marcial y has obtenido una dote de estilo de lucha de tu elección (ver “Dotes”). Se recomienda la defensa.\n\nSiempre que ganes un nivel de Luchador, puedes reemplazar la hazaña que elegiste con una hazaña de Estilo de lucha diferente."
      },
      {
        id: "fighter:lvl1:second-wind:2",
        name: "Segundo aliento",
        class: "fighter",
        level: 1,
        description: "Tienes una fuente limitada de resistencia física y mental a la que puedes recurrir. Como acción adicional, puedes usarla para recuperar puntos de vida equivalentes a 1d10 más tu nivel de luchador.\n\nPuede utilizar esta función dos veces. Recuperas un uso gastado cuando terminas un Descanso Corto y recuperas todos los usos gastados cuando terminas un Descanso Largo.\n\nCuando alcanzas ciertos niveles de luchador, obtienes más usos de esta característica, como se muestra en la columna Segundo viento de la tabla de características del luchador."
      },
      {
        id: "fighter:lvl1:weapon-mastery:3",
        name: "Dominio de armas",
        class: "fighter",
        level: 1,
        description: "Tu entrenamiento con armas te permite utilizar las propiedades de dominio de tres tipos de armas simples o marciales de tu elección. Cada vez que termines un descanso prolongado, podrás practicar ejercicios con armas y cambiar una de esas opciones de armas.\n\nCuando alcanzas ciertos niveles de luchador, obtienes la capacidad de usar las propiedades de dominio de más tipos de armas, como se muestra en la columna Dominio de armas de la tabla de características del luchador."
      },
      {
        id: "fighter:lvl2:action-surge-one-use:1",
        name: "Action Surge (un uso)",
        class: "fighter",
        level: 2
      },
      {
        id: "fighter:lvl2:tactical-mind:2",
        name: "Mente táctica",
        class: "fighter",
        level: 2,
        description: "Tienes mente para las tácticas dentro y fuera del campo de batalla. Cuando fallas una prueba de habilidad, puedes gastar un uso de tu Segundo aliento para impulsarte hacia el éxito. En lugar de recuperar puntos de vida, tiras 1d10 y sumas el número obtenido a la prueba de habilidad, convirtiéndola potencialmente en un éxito. Si la prueba aún falla, este uso de Second Wind no se gasta."
      },
      {
        id: "fighter:lvl3:fighter-subclass:1",
        name: "Subclase de luchador",
        class: "fighter",
        level: 3,
        description: "Obtienes una subclase de luchador de tu elección. La subclase Campeón se detalla después de la descripción de esta clase. Una subclase es una especialización que te otorga características en ciertos niveles de luchador. Durante el resto de tu carrera, obtienes cada una de las características de tu subclase que sean de tu nivel de Luchador o inferior."
      },
      {
        id: "fighter:lvl4:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "fighter",
        level: 4,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de luchador 6, 8, 12, 14 y 16."
      },
      {
        id: "fighter:lvl5:extra-attack:1",
        name: "Ataque extra",
        class: "fighter",
        level: 5,
        description: "Puedes atacar dos veces en lugar de una cada vez que realizas la acción de Atacar en tu turno."
      },
      {
        id: "fighter:lvl5:tactical-shift:2",
        name: "Cambio táctico",
        class: "fighter",
        level: 5,
        description: "Siempre que activas tu Segundo Viento con una Acción Bonus, puedes moverte hasta la mitad de tu Velocidad sin provocar Ataques de Oportunidad."
      },
      {
        id: "fighter:lvl6:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "fighter",
        level: 6,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de luchador 6, 8, 12, 14 y 16."
      },
      {
        id: "fighter:lvl7:subclass-feature:1",
        name: "Característica de subclase",
        class: "fighter",
        level: 7
      },
      {
        id: "fighter:lvl8:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "fighter",
        level: 8,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de luchador 6, 8, 12, 14 y 16."
      },
      {
        id: "fighter:lvl9:indomitable-one-use:1",
        name: "Indomable (un uso)",
        class: "fighter",
        level: 9
      },
      {
        id: "fighter:lvl9:tactical-master:2",
        name: "Maestro táctico",
        class: "fighter",
        level: 9,
        description: "Cuando atacas con un arma cuya propiedad de dominio puedes usar, puedes reemplazar esa propiedad con la propiedad Empujar, Saquear o Ralentizar para ese ataque."
      },
      {
        id: "fighter:lvl10:subclass-feature:1",
        name: "Característica de subclase",
        class: "fighter",
        level: 10
      },
      {
        id: "fighter:lvl11:two-extra-attacks:1",
        name: "Dos ataques adicionales",
        class: "fighter",
        level: 11,
        description: "Puedes atacar tres veces en lugar de una cada vez que realices la acción de Ataque en tu turno."
      },
      {
        id: "fighter:lvl12:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "fighter",
        level: 12,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de luchador 6, 8, 12, 14 y 16."
      },
      {
        id: "fighter:lvl13:indomitable-two-uses:1",
        name: "Indomable (dos usos)",
        class: "fighter",
        level: 13
      },
      {
        id: "fighter:lvl13:studied-attacks:2",
        name: "Ataques estudiados",
        class: "fighter",
        level: 13,
        description: "Estudias a tus oponentes y aprendes de cada ataque que realizas. Si haces una tirada de ataque contra una criatura y fallas, tienes Ventaja en tu próxima tirada de ataque contra esa criatura antes del final de tu siguiente turno."
      },
      {
        id: "fighter:lvl14:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "fighter",
        level: 14,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de luchador 6, 8, 12, 14 y 16."
      },
      {
        id: "fighter:lvl15:subclass-feature:1",
        name: "Característica de subclase",
        class: "fighter",
        level: 15
      },
      {
        id: "fighter:lvl16:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "fighter",
        level: 16,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de luchador 6, 8, 12, 14 y 16."
      },
      {
        id: "fighter:lvl17:action-surge-two-uses:1",
        name: "Action Surge (dos usos)",
        class: "fighter",
        level: 17
      },
      {
        id: "fighter:lvl17:indomitable-three-uses:2",
        name: "Indomable (tres usos)",
        class: "fighter",
        level: 17
      },
      {
        id: "fighter:lvl18:subclass-feature:1",
        name: "Característica de subclase",
        class: "fighter",
        level: 18
      },
      {
        id: "fighter:lvl19:epic-boon:1",
        name: "Bendición épica",
        class: "fighter",
        level: 19,
        description: "Obtienes una dote de bendición épica (ver “Dotes”) u otra dote de tu elección para la cual calificas. Se recomienda la bendición de la destreza en combate."
      },
      {
        id: "fighter:lvl20:three-extra-attacks:1",
        name: "Tres ataques adicionales",
        class: "fighter",
        level: 20,
        description: "Puedes atacar cuatro veces en lugar de una cada vez que realices la acción de Ataque en tu turno."
      }
    ],
    subclasses: [
      {
        id: "fighter:champion",
        name: "Campeón",
        classId: "fighter",
        unlockLevel: 3,
        source: "Reglas gratuitas de D&D 2024",
        features: [
          {
            id: "fighter:champion:lvl3:improved-critical",
            name: "Crítico mejorado",
            class: "fighter",
            level: 3,
            subclassId: "fighter:champion",
            subclassName: "Campeón",
            description: "Tus tiradas de ataque con armas y los ataques sin armas pueden conseguir un golpe crítico con una tirada de 19 o 20 en el d20."
          },
          {
            id: "fighter:champion:lvl3:remarkable-athlete",
            name: "Atleta notable",
            class: "fighter",
            level: 3,
            subclassId: "fighter:champion",
            subclassName: "Campeón",
            description: "Gracias a tu atletismo, tienes Ventaja en las tiradas de Iniciativa y en las pruebas de Fuerza (Atletismo).\n\nAdemás, inmediatamente después de conseguir un golpe crítico, puedes moverte hasta la mitad de tu velocidad sin provocar ataques de oportunidad."
          },
          {
            id: "fighter:champion:lvl7:additional-fighting-style",
            name: "Estilo de lucha adicional",
            class: "fighter",
            level: 7,
            subclassId: "fighter:champion",
            subclassName: "Campeón",
            description: "Obtienes otra dote de estilo de lucha de tu elección."
          },
          {
            id: "fighter:champion:lvl10:heroic-warrior",
            name: "guerrero heroico",
            class: "fighter",
            level: 10,
            subclassId: "fighter:champion",
            subclassName: "Campeón",
            description: "La emoción de la batalla te lleva hacia la victoria. Durante el combate, puedes darte inspiración heroica cada vez que comiences tu turno sin ella."
          },
          {
            id: "fighter:champion:lvl15:superior-critical",
            name: "Crítico superior",
            class: "fighter",
            level: 15,
            subclassId: "fighter:champion",
            subclassName: "Campeón",
            description: "Tus tiradas de ataque con armas y los ataques sin armas ahora pueden generar un golpe crítico con una tirada de 18 a 20 en el d20."
          },
          {
            id: "fighter:champion:lvl18:survivor",
            name: "Sobreviviente",
            class: "fighter",
            level: 18,
            subclassId: "fighter:champion",
            subclassName: "Campeón",
            description: "Alcanzas el pináculo de la resiliencia en la batalla, brindándote estos beneficios.\n\nDesafía a la muerte. Tienes ventaja en los tiros de salvación de la muerte. Además, cuando obtienes un resultado de 18 a 20 en una tirada de salvación de muerte, obtienes el beneficio de obtener un 20 en ella.\n\nManifestación heroica. Al comienzo de cada uno de tus turnos, recuperas puntos de vida equivalentes a 5 más tu modificador de Constitución si estás ensangrentado y tienes al menos 1 punto de vida."
          }
        ]
      }
    ]
  },
  monk: {
    classId: "monk",
    className: "Monje",
    source: "Reglas gratuitas de D&D 2024",
    subclassUnlockLevel: 3,
    classFeatures: [
      {
        id: "monk:lvl1:martial-arts:1",
        name: "Artes marciales",
        class: "monk",
        level: 1,
        description: "Tu práctica de artes marciales te brinda dominio de los estilos de combate que utilizan tus armas Desarmed Strike y Monk, que son las siguientes:\n\nObtienes los siguientes beneficios mientras estás desarmado o empuñas solo armas de Monje y no llevas armadura ni empuñas un escudo.\n\nBonificación por ataque desarmado. Puedes realizar un ataque desarmado como acción adicional.\n\nMuere artes marciales. Puedes tirar 1d6 en lugar del daño normal de tus armas de Golpe desarmado o Monje. Este dado cambia a medida que ganas niveles de Monje, como se muestra en la columna Artes Marciales de la tabla de Características del Monje.\n\nAtaques diestros. Puedes usar tu modificador de Destreza en lugar de tu modificador de Fuerza para las tiradas de ataque y daño de tus ataques desarmados y armas de Monje. Además, cuando usas la opción Agarre o Empujón de tu Golpe desarmado, puedes usar tu modificador de Destreza en lugar de tu modificador de Fuerza para determinar la CD de salvación."
      },
      {
        id: "monk:lvl1:unarmored-defense:2",
        name: "Defensa sin armadura",
        class: "monk",
        level: 1,
        description: "Mientras no uses armadura ni empuñes un escudo, tu Clase de Armadura base es igual a 10 más tus modificadores de Destreza y Sabiduría."
      },
      {
        id: "monk:lvl2:monk-s-focus:1",
        name: "El enfoque del monje",
        class: "monk",
        level: 2,
        description: "Tu concentración y entrenamiento marcial te permiten aprovechar una fuente de energía extraordinaria dentro de ti. Esta energía está representada por los puntos de enfoque. Tu nivel de Monje determina la cantidad de puntos que tienes, como se muestra en la columna Puntos de enfoque de la tabla de Características del Monje.\n\nPuedes gastar estos puntos para mejorar o potenciar ciertas características del Monje. Empezarás conociendo tres de estas funciones: Ráfaga de golpes, Defensa del paciente y Paso del viento, cada una de las cuales se detalla a continuación.\n\nCuando gastas un punto de concentración, no está disponible hasta que finalizas un descanso corto o largo, al final del cual recuperas todos los puntos gastados.\n\nAlgunas funciones que utilizan puntos de concentración requieren que tu objetivo realice una tirada de salvación. La CD de salvación equivale a 8 más tu modificador de Sabiduría y Bonificación de Competencia.\n\nRáfaga de golpes. Puedes gastar 1 punto de enfoque para realizar dos ataques sin armas como acción adicional.\n\nDefensa del Paciente. Puedes realizar la acción Desengancharse como acción adicional. Alternativamente, puedes gastar 1 punto de enfoque para realizar las acciones de Destrabarse y Esquivar como acción adicional.\n\nPaso del Viento. Puedes realizar la acción Dash como acción adicional. Alternativamente, puedes gastar 1 punto de enfoque para realizar las acciones Desenganchar y Correr como acción adicional, y tu distancia de salto se duplicará durante el turno."
      },
      {
        id: "monk:lvl2:unarmored-movement:2",
        name: "Movimiento sin armadura",
        class: "monk",
        level: 2,
        description: "Tu velocidad aumenta 10 pies mientras no llevas armadura ni empuñas un escudo. Esta bonificación aumenta cuando alcanzas ciertos niveles de Monje, como se muestra en la tabla de Características del Monje."
      },
      {
        id: "monk:lvl2:uncanny-metabolism:3",
        name: "Metabolismo extraño",
        class: "monk",
        level: 2,
        description: "Cuando tiras Iniciativa, puedes recuperar todos los puntos de concentración gastados. Cuando lo hagas, tira tu dado de Artes Marciales y recupera una cantidad de Puntos de Vida igual a tu nivel de Monje más el número obtenido.\n\nUna vez que uses esta función, no podrás volver a usarla hasta que termines un descanso prolongado."
      },
      {
        id: "monk:lvl3:deflect-attacks:1",
        name: "Desviar ataques",
        class: "monk",
        level: 3,
        description: "Cuando una tirada de ataque te golpea y su daño incluye daño contundente, perforante o cortante, puedes tomar una reacción para reducir el daño total del ataque contra ti. La reducción equivale a 1d10 más tu modificador de Destreza y tu nivel de Monje.\n\nSi reduce el daño a 0, puede gastar 1 punto de enfoque para redirigir parte de la fuerza del ataque. Si lo haces, elige una criatura que puedas ver a 5 pies de ti si el ataque fue un ataque cuerpo a cuerpo o una criatura que puedas ver a 60 pies de ti que no esté detrás de Cobertura total si el ataque fue un ataque a distancia. Esa criatura debe tener éxito en una tirada de salvación de Destreza o sufrir un daño equivalente a dos tiradas de tu dado de Artes Marciales más tu modificador de Destreza. El daño es del mismo tipo que el ataque."
      },
      {
        id: "monk:lvl3:monk-subclass:2",
        name: "Subclase de monje",
        class: "monk",
        level: 3,
        description: "Obtienes una subclase de Monje de tu elección. La subclase Guerrero de la Mano Abierta se detalla después de la descripción de esta clase. Una subclase es una especialización que te otorga características en ciertos niveles de Monje. Durante el resto de tu carrera, obtienes cada una de las características de tu subclase que sean de tu nivel de Monje o inferior."
      },
      {
        id: "monk:lvl4:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "monk",
        level: 4,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de Monje 8, 12 y 16."
      },
      {
        id: "monk:lvl4:slow-fall:2",
        name: "caída lenta",
        class: "monk",
        level: 4,
        description: "Puedes reaccionar cuando caes para reducir el daño que recibas por la caída en una cantidad equivalente a cinco veces tu nivel de Monje."
      },
      {
        id: "monk:lvl5:extra-attack:1",
        name: "Ataque extra",
        class: "monk",
        level: 5,
        description: "Puedes atacar dos veces en lugar de una cada vez que realizas la acción de Atacar en tu turno."
      },
      {
        id: "monk:lvl5:stunning-strike:2",
        name: "Golpe aturdidor",
        class: "monk",
        level: 5,
        description: "Una vez por turno, cuando golpeas a una criatura con un arma de Monje o un Golpe Desarmado, puedes gastar 1 Punto de Enfoque para intentar un golpe aturdidor. El objetivo debe realizar una tirada de salvación de Constitución. En caso de una salvación fallida, el objetivo queda aturdido hasta el comienzo de tu siguiente turno. En una salvación exitosa, la Velocidad del objetivo se reduce a la mitad hasta el comienzo de tu siguiente turno, y la siguiente tirada de ataque realizada contra el objetivo antes de esa fecha tiene Ventaja."
      },
      {
        id: "monk:lvl6:empowered-strikes:1",
        name: "Huelgas potenciadas",
        class: "monk",
        level: 6,
        description: "Siempre que inflijas daño con tu Golpe desarmado, puede causar tu elección de daño de Fuerza o su tipo de daño normal."
      },
      {
        id: "monk:lvl6:subclass-feature:2",
        name: "Característica de subclase",
        class: "monk",
        level: 6
      },
      {
        id: "monk:lvl7:evasion:1",
        name: "Evasión",
        class: "monk",
        level: 7,
        description: "Cuando estás sujeto a un efecto que te permite realizar una tirada de salvación de Destreza para recibir solo la mitad del daño, no recibes daño si tienes éxito en la tirada de salvación y solo la mitad del daño si fallas.\n\nNo se beneficia de esta función si tiene la condición de Incapacitado."
      },
      {
        id: "monk:lvl8:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "monk",
        level: 8,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de Monje 8, 12 y 16."
      },
      {
        id: "monk:lvl9:acrobatic-movement:1",
        name: "Movimiento acrobático",
        class: "monk",
        level: 9,
        description: "Si bien no llevas armadura ni empuñas un escudo, obtienes la capacidad de moverte a lo largo de superficies verticales y a través de líquidos en tu turno sin caerte durante el movimiento."
      },
      {
        id: "monk:lvl10:heightened-focus:1",
        name: "Enfoque aumentado",
        class: "monk",
        level: 10,
        description: "Tu Ráfaga de golpes, Defensa paciente y Paso del viento obtienen los siguientes beneficios.\n\nRáfaga de golpes. Puedes gastar 1 punto de enfoque para usar Ráfaga de golpes y realizar tres golpes desarmados con él en lugar de dos.\n\nDefensa del Paciente. Cuando gastas un punto de concentración para usar la defensa del paciente, obtienes una cantidad de puntos de vida temporales igual a dos tiradas de tu dado de artes marciales.\n\nPaso del Viento. Cuando gastas un punto de enfoque para usar Paso del viento, puedes elegir una criatura dispuesta a 5 pies de ti que sea grande o más pequeña. Mueves la criatura contigo hasta el final de tu turno. El movimiento de la criatura no provoca ataques de oportunidad."
      },
      {
        id: "monk:lvl10:self-restoration:2",
        name: "Autorestauración",
        class: "monk",
        level: 10,
        description: "Por pura fuerza de voluntad, puedes eliminar una de las siguientes condiciones al final de cada uno de tus turnos: encantado, asustado o envenenado.\n\nAdemás, renunciar a la comida y la bebida no produce niveles de agotamiento."
      },
      {
        id: "monk:lvl11:subclass-feature:1",
        name: "Característica de subclase",
        class: "monk",
        level: 11
      },
      {
        id: "monk:lvl12:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "monk",
        level: 12,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de Monje 8, 12 y 16."
      },
      {
        id: "monk:lvl13:deflect-energy:1",
        name: "Desviar energía",
        class: "monk",
        level: 13,
        description: "Ahora puedes usar tu función Desviar ataques contra ataques que causan cualquier tipo de daño, no solo contundentes, perforantes o cortantes."
      },
      {
        id: "monk:lvl14:disciplined-survivor:1",
        name: "Sobreviviente disciplinado",
        class: "monk",
        level: 14,
        description: "Tu disciplina física y mental te otorga competencia en todos los tiros de salvación.\n\nAdemás, cada vez que realizas una tirada de salvación y fallas, puedes gastar 1 punto de enfoque para volver a tirarla, y debes usar la nueva tirada."
      },
      {
        id: "monk:lvl15:perfect-focus:1",
        name: "Enfoque perfecto",
        class: "monk",
        level: 15,
        description: "Cuando tiras Iniciativa y no usas Metabolismo asombroso, recuperas los puntos de concentración gastados hasta que tienes 4 si tienes 3 o menos."
      },
      {
        id: "monk:lvl16:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "monk",
        level: 16,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de Monje 8, 12 y 16."
      },
      {
        id: "monk:lvl17:subclass-feature:1",
        name: "Característica de subclase",
        class: "monk",
        level: 17
      },
      {
        id: "monk:lvl18:superior-defense:1",
        name: "Defensa superior",
        class: "monk",
        level: 18,
        description: "Al comienzo de tu turno, puedes gastar 3 puntos de concentración para reforzarte contra el daño durante 1 minuto o hasta que tengas la condición de Incapacitado. Durante ese tiempo, tienes Resistencia a todo el daño excepto al daño de Fuerza."
      },
      {
        id: "monk:lvl19:epic-boon:1",
        name: "Bendición épica",
        class: "monk",
        level: 19,
        description: "Obtienes una dote de bendición épica (ver “Dotes”) u otra dote de tu elección para la cual calificas. Se recomienda la bendición de la ofensiva irresistible."
      },
      {
        id: "monk:lvl20:body-and-mind:1",
        name: "Cuerpo y Mente",
        class: "monk",
        level: 20,
        description: "Ha desarrollado su cuerpo y su mente a nuevas alturas. Tus puntuaciones de Destreza y Sabiduría aumentan en 4, hasta un máximo de 25."
      }
    ],
    subclasses: [
      {
        id: "monk:warrior-of-the-open-hand",
        name: "Guerrero de la mano abierta",
        classId: "monk",
        unlockLevel: 3,
        source: "Reglas gratuitas de D&D 2024",
        features: [
          {
            id: "monk:warrior-of-the-open-hand:lvl3:open-hand-technique",
            name: "Técnica de mano abierta",
            class: "monk",
            level: 3,
            subclassId: "monk:warrior-of-the-open-hand",
            subclassName: "Guerrero de la mano abierta",
            description: "Siempre que golpeas a una criatura con un ataque otorgado por tu Ráfaga de golpes, puedes imponer uno de los siguientes efectos a ese objetivo.\n\nPodrido. El objetivo no puede realizar ataques de oportunidad hasta el comienzo de su siguiente turno.\n\nEmpujar. El objetivo debe superar una tirada de salvación de Fuerza o ser empujado hasta 15 pies de distancia de ti.\n\nDerrocar. El objetivo debe superar una tirada de salvación de Destreza o estar en estado boca abajo."
          },
          {
            id: "monk:warrior-of-the-open-hand:lvl6:wholeness-of-body",
            name: "Totalidad del cuerpo",
            class: "monk",
            level: 6,
            subclassId: "monk:warrior-of-the-open-hand",
            subclassName: "Guerrero de la mano abierta",
            description: "Obtienes la capacidad de curarte a ti mismo. Como acción adicional, puedes tirar tu dado de artes marciales. Recuperas una cantidad de puntos de vida igual al número obtenido más tu modificador de Sabiduría (mínimo de 1 punto de vida recuperado).\n\nPuedes usar esta característica una cantidad de veces igual a tu modificador de Sabiduría (mínimo una vez) y recuperas todos los usos gastados cuando terminas un Descanso Largo."
          },
          {
            id: "monk:warrior-of-the-open-hand:lvl11:fleet-step",
            name: "Paso de flota",
            class: "monk",
            level: 11,
            subclassId: "monk:warrior-of-the-open-hand",
            subclassName: "Guerrero de la mano abierta",
            description: "Cuando realizas una acción adicional que no sea Paso del viento, también puedes usar Paso del viento inmediatamente después de esa acción adicional."
          },
          {
            id: "monk:warrior-of-the-open-hand:lvl17:quivering-palm",
            name: "Palma temblorosa",
            class: "monk",
            level: 17,
            subclassId: "monk:warrior-of-the-open-hand",
            subclassName: "Guerrero de la mano abierta",
            description: "Obtienes la capacidad de generar vibraciones letales en el cuerpo de alguien. Cuando golpeas a una criatura con un Golpe desarmado, puedes gastar 4 puntos de concentración para iniciar estas vibraciones imperceptibles, que duran una cantidad de días igual a tu nivel de Monje. Las vibraciones son inofensivas a menos que tomes medidas para acabar con ellas. Alternativamente, cuando realizas la acción de Ataque en tu turno, puedes renunciar a uno de los ataques para finalizar las vibraciones. Para acabar con ellos, tú y el objetivo debéis estar en el mismo plano de existencia. Cuando los terminas, el objetivo debe realizar una tirada de salvación de Constitución, recibiendo 10d12 de daño de Fuerza en una salvación fallida o la mitad de daño en una exitosa.\n\nSólo puedes tener una criatura bajo el efecto de esta característica a la vez. Puede finalizar las vibraciones de forma inofensiva (no se requiere ninguna acción)."
          }
        ]
      }
    ]
  },
  paladin: {
    classId: "paladin",
    className: "Paladín",
    source: "Reglas gratuitas de D&D 2024",
    subclassUnlockLevel: 3,
    classFeatures: [
      {
        id: "paladin:lvl1:lay-on-hands:1",
        name: "Imposición de manos",
        class: "paladin",
        level: 1,
        description: "Tu toque bendito puede curar heridas. Tienes una reserva de poder curativo que se repone cuando terminas un descanso prolongado. Con ese grupo, puedes restaurar una cantidad total de puntos de vida igual a cinco veces tu nivel de paladín.\n\nComo acción adicional, puedes tocar una criatura (que podrías ser tú mismo) y extraer poder de la reserva de curación para restaurar una cantidad de puntos de vida a esa criatura, hasta la cantidad máxima restante en la reserva.\n\nTambién puedes gastar 5 puntos de vida de la reserva de poder curativo para eliminar la condición de envenenado de la criatura; esos puntos tampoco restauran los puntos de vida de la criatura."
      },
      {
        id: "paladin:lvl1:spellcasting:2",
        name: "Lanzamiento de hechizos",
        class: "paladin",
        level: 1,
        description: "Has aprendido a lanzar hechizos mediante la oración y la meditación. Consulta \"Hechizos\" para conocer las reglas sobre el lanzamiento de hechizos. La siguiente información detalla cómo se usan esas reglas con los hechizos de Paladín, que aparecen en la lista de hechizos de Paladín más adelante en la descripción de la clase.\n\nRanuras para hechizos. La tabla de características del paladín muestra cuántos espacios para hechizos tienes para lanzar tus hechizos de nivel 1+. Recuperas todos los espacios gastados cuando terminas un descanso prolongado.\n\nHechizos preparados de nivel 1+. Usted prepara la lista de hechizos de nivel 1+ que están disponibles para lanzar con esta función. Para empezar, elige dos hechizos de Paladín de nivel 1. Se recomienda el heroísmo y el castigo abrasador.\n\nLa cantidad de hechizos en tu lista aumenta a medida que ganas niveles de Paladín, como se muestra en la columna Hechizos preparados de la tabla Características del Paladín. Siempre que ese número aumente, elige hechizos de Paladín adicionales hasta que el número de hechizos en tu lista coincida con el número en la tabla de Características del Paladín. Los hechizos elegidos deben ser de un nivel para el que tengas espacios para hechizos. Por ejemplo, si eres un Paladín de nivel 5, tu lista de hechizos preparados puede incluir seis hechizos de Paladín de nivel 1 o 2 en cualquier combinación.\n\nSi otra característica de Paladín te proporciona hechizos que siempre has preparado, esos hechizos no cuentan para la cantidad de hechizos que puedes preparar con esta característica, pero esos hechizos cuentan como hechizos de Paladín para ti.\n\nCambiando tus hechizos preparados. Siempre que termines un descanso prolongado, puedes reemplazar un hechizo de tu lista con otro hechizo de Paladín para el que tengas espacios para hechizos.\n\nHabilidad de lanzar hechizos. El carisma es tu habilidad para lanzar hechizos para tus hechizos de Paladín.\n\nEnfoque de lanzamiento de hechizos. Puedes usar un símbolo sagrado como foco de lanzamiento de hechizos para tus hechizos de paladín."
      },
      {
        id: "paladin:lvl1:weapon-mastery:3",
        name: "Dominio de armas",
        class: "paladin",
        level: 1,
        description: "Tu entrenamiento con armas te permite utilizar las propiedades de dominio de dos tipos de armas de tu elección con las que tienes competencia, como espadas largas y jabalinas.\n\nCada vez que termines un descanso prolongado, podrás cambiar los tipos de armas que elegiste. Por ejemplo, podrías pasar a utilizar las propiedades de dominio de Alabardas y Mayales."
      },
      {
        id: "paladin:lvl2:fighting-style:1",
        name: "Estilo de lucha",
        class: "paladin",
        level: 2,
        description: "Obtienes una dote de estilo de lucha de tu elección (consulta “Dotes” para conocer las dotes). En lugar de elegir una de esas hazañas, puedes elegir la opción a continuación.\n\nBendito Guerrero. Aprendes dos trucos de clérigo de tu elección (consulta la sección de la clase de clérigo para obtener una lista de hechizos de clérigo). Se recomienda orientación y Llama Sagrada. Los trucos elegidos cuentan como hechizos de Paladín para ti, y el Carisma es tu habilidad para lanzar hechizos para ellos. Siempre que ganes un nivel de Paladín, puedes reemplazar uno de estos trucos con otro truco de Clérigo."
      },
      {
        id: "paladin:lvl2:divine-smite-paladin-s-smite:2",
        name: "Golpe divino (golpe del paladín)",
        class: "paladin",
        level: 2,
        description: "Siempre tienes preparado el hechizo Divine Smite. Además, puedes lanzarlo sin gastar un espacio de hechizo, pero debes terminar un Descanso Largo antes de poder lanzarlo de esta manera nuevamente."
      },
      {
        id: "paladin:lvl3:channel-divinity:1",
        name: "Canalizar la Divinidad",
        class: "paladin",
        level: 3,
        description: "Puedes canalizar energía divina directamente desde los planos exteriores y utilizarla para impulsar efectos mágicos. Comienzas con uno de esos efectos: Sentido Divino, que se describe a continuación. Otras características de Paladin brindan opciones adicionales de efectos de Channel Divinity. Cada vez que usas Channel Divinity de esta clase, eliges qué efecto de esta clase crear.\n\nPuedes usar Channel Divinity de esta clase dos veces. Recuperas uno de sus usos gastados cuando terminas un Descanso Corto, y recuperas todos los usos gastados cuando terminas un Descanso Largo. Obtienes un uso adicional cuando alcanzas el nivel 11 de Paladín.\n\nSi un efecto de Canalizar Divinidad requiere una tirada de salvación, la CD es igual a la CD de salvación del hechizo de la función Lanzamiento de hechizos de esta clase.\n\nSentido Divino. Como acción adicional, puedes abrir tu conciencia para detectar celestiales, demonios y no muertos. Durante los próximos 10 minutos o hasta que tengas la condición de Incapacitado, conoces la ubicación de cualquier criatura de esos tipos dentro de 60 pies de ti y conoces su tipo de criatura. Dentro del mismo radio, también detectas la presencia de cualquier lugar u objeto que haya sido consagrado o profanado, como ocurre con el hechizo Hallow."
      },
      {
        id: "paladin:lvl3:paladin-subclass:2",
        name: "Subclase de paladín",
        class: "paladin",
        level: 3,
        description: "Obtienes una subclase de Paladín de tu elección. La subclase Juramento de Devoción se detalla después de la descripción de esta clase. Una subclase es una especialización que te otorga características en ciertos niveles de Paladín. Durante el resto de tu carrera, obtienes cada una de las características de tu subclase que sean de tu nivel de Paladín o inferior.\n\nRompiendo tu juramento\n\nUn Paladín intenta mantener los más altos estándares de conducta, pero incluso los más dedicados son falibles. A veces un paladín transgrede su juramento.\n\nUn paladín que ha roto un voto normalmente busca la absolución, pasando una vigilia toda la noche como señal de penitencia o realizando un ayuno. Después de un rito de perdón, el Paladín comienza de nuevo.\n\nSi tu Paladín viola su juramento sin arrepentimiento, habla con tu DM. Tu Paladín probablemente debería tomar una subclase más apropiada o incluso abandonar la clase y adoptar otra."
      },
      {
        id: "paladin:lvl4:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "paladin",
        level: 4,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de Paladín 8, 12 y 16."
      },
      {
        id: "paladin:lvl5:extra-attack:1",
        name: "Ataque extra",
        class: "paladin",
        level: 5,
        description: "Puedes atacar dos veces en lugar de una cada vez que realizas la acción de Atacar en tu turno."
      },
      {
        id: "paladin:lvl5:faithful-steed:2",
        name: "Corcel fiel",
        class: "paladin",
        level: 5,
        description: "Puedes pedir la ayuda de un corcel de otro mundo. Siempre tienes preparado el hechizo Find Steed.\n\nTambién puedes lanzar el hechizo una vez sin gastar un espacio de hechizo, y recuperas la capacidad de hacerlo cuando terminas un Descanso Largo."
      },
      {
        id: "paladin:lvl6:aura-of-protection:1",
        name: "Aura de protección",
        class: "paladin",
        level: 6,
        description: "Irradias un aura protectora e invisible en una emanación de 10 pies que se origina en ti. El aura está inactiva mientras estás en la condición de Incapacitado.\n\nTú y tus aliados en el aura ganáis una bonificación a las tiradas de salvación igual a vuestro modificador de Carisma (bonificación mínima de +1).\n\nSi hay otro Paladín presente, una criatura sólo puede beneficiarse de un Aura de Protección a la vez; la criatura elige qué aura mientras está en ellos."
      },
      {
        id: "paladin:lvl7:subclass-feature:1",
        name: "Característica de subclase",
        class: "paladin",
        level: 7
      },
      {
        id: "paladin:lvl8:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "paladin",
        level: 8,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de Paladín 8, 12 y 16."
      },
      {
        id: "paladin:lvl9:abjure-foes:1",
        name: "Abjurar enemigos",
        class: "paladin",
        level: 9,
        description: "Como acción mágica, puedes gastar un uso de Canalizar divinidad de esta clase para abrumar a los enemigos con asombro. Al presentar tu Símbolo Sagrado o arma, puedes apuntar a una cantidad de criaturas igual a tu modificador de Carisma (mínimo de una criatura) que puedas ver a menos de 60 pies de ti. Cada objetivo debe superar una tirada de salvación de Sabiduría o tener la condición de Asustado durante 1 minuto o hasta que reciba algún daño. Mientras está asustado de esta manera, un objetivo sólo puede realizar una de las siguientes acciones en sus turnos: moverse, realizar una acción o realizar una acción adicional."
      },
      {
        id: "paladin:lvl10:aura-of-courage:1",
        name: "Aura de coraje",
        class: "paladin",
        level: 10,
        description: "Tú y tus aliados tenéis inmunidad a la condición Asustado mientras estéis en vuestro Aura de Protección. Si un aliado asustado entra en el aura, esa condición no tiene ningún efecto sobre ese aliado mientras esté allí."
      },
      {
        id: "paladin:lvl11:radiant-strikes:1",
        name: "Golpes radiantes",
        class: "paladin",
        level: 11,
        description: "Tus ataques ahora tienen un poder sobrenatural. Cuando golpeas a un objetivo con una tirada de ataque usando un arma cuerpo a cuerpo o un golpe desarmado, el objetivo sufre 1d8 de daño radiante adicional."
      },
      {
        id: "paladin:lvl12:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "paladin",
        level: 12,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de Paladín 8, 12 y 16."
      },
      {
        id: "paladin:lvl13:feature:1",
        name: "—",
        class: "paladin",
        level: 13
      },
      {
        id: "paladin:lvl14:restoring-touch:1",
        name: "Restaurando el tacto",
        class: "paladin",
        level: 14,
        description: "Cuando usas Imposición de manos sobre una criatura, también puedes eliminar una o más de las siguientes condiciones de la criatura: cegado, hechizado, ensordecido, asustado, paralizado o aturdido. Debes gastar 5 puntos de vida de la reserva de curación de Imposición de manos por cada una de estas condiciones que elimines; esos puntos tampoco restauran los puntos de vida de la criatura."
      },
      {
        id: "paladin:lvl15:subclass-feature:1",
        name: "Característica de subclase",
        class: "paladin",
        level: 15
      },
      {
        id: "paladin:lvl16:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "paladin",
        level: 16,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de Paladín 8, 12 y 16."
      },
      {
        id: "paladin:lvl17:feature:1",
        name: "—",
        class: "paladin",
        level: 17
      },
      {
        id: "paladin:lvl18:aura-expansion:1",
        name: "Expansión del aura",
        class: "paladin",
        level: 18,
        description: "Tu Aura de Protección ahora es una Emanación de 30 pies."
      },
      {
        id: "paladin:lvl19:epic-boon:1",
        name: "Bendición épica",
        class: "paladin",
        level: 19,
        description: "Obtienes una dote de bendición épica (ver “Dotes”) u otra dote de tu elección para la cual calificas. Se recomienda la bendición de Truesight."
      },
      {
        id: "paladin:lvl20:subclass-feature:1",
        name: "Característica de subclase",
        class: "paladin",
        level: 20
      }
    ],
    subclasses: [
      {
        id: "paladin:oath-of-devotion",
        name: "Juramento de devoción",
        classId: "paladin",
        unlockLevel: 3,
        source: "Reglas gratuitas de D&D 2024",
        features: [
          {
            id: "paladin:oath-of-devotion:lvl3:oath-of-devotion-spells",
            name: "Hechizos de juramento de devoción",
            class: "paladin",
            level: 3,
            subclassId: "paladin:oath-of-devotion",
            subclassName: "Juramento de devoción",
            description: "La magia de tu juramento asegura que siempre tengas ciertos hechizos listos; Cuando alcanzas un nivel de Paladín especificado en la tabla de Hechizos del Juramento de Devoción, a partir de entonces siempre tendrás preparados los hechizos enumerados."
          },
          {
            id: "paladin:oath-of-devotion:lvl3:sacred-weapon",
            name: "Arma sagrada",
            class: "paladin",
            level: 3,
            subclassId: "paladin:oath-of-devotion",
            subclassName: "Juramento de devoción",
            description: "Cuando realizas la acción de Ataque, puedes gastar un uso de tu Canalizar Divinidad para imbuir un arma cuerpo a cuerpo que estás sosteniendo con energía positiva. Durante 10 minutos o hasta que uses esta característica nuevamente, agregas tu modificador de Carisma a las tiradas de ataque que haces con esa arma (bonificación mínima de +1), y cada vez que golpeas con ella, haces que cause su tipo de daño normal o daño Radiante.\n\nEl arma también emite luz brillante en un radio de 20 pies y luz tenue 20 pies más allá.\n\nPuedes finalizar este efecto antes de tiempo (no se requiere ninguna acción). Este efecto también termina si no llevas el arma."
          },
          {
            id: "paladin:oath-of-devotion:lvl7:aura-of-devotion",
            name: "Aura de devoción",
            class: "paladin",
            level: 7,
            subclassId: "paladin:oath-of-devotion",
            subclassName: "Juramento de devoción",
            description: "Tú y tus aliados tenéis inmunidad a la condición Embrujados mientras estéis en vuestro Aura de Protección. Si un aliado encantado entra en el aura, esa condición no tiene ningún efecto sobre ese aliado mientras esté allí."
          },
          {
            id: "paladin:oath-of-devotion:lvl15:smite-of-protection",
            name: "Golpe de protección",
            class: "paladin",
            level: 15,
            subclassId: "paladin:oath-of-devotion",
            subclassName: "Juramento de devoción",
            description: "Tu golpe mágico ahora irradia energía protectora. Siempre que lanzas Golpe Divino, tú y tus aliados tenéis Media Cobertura mientras estáis en vuestro Aura de Protección. El aura tiene este beneficio hasta el inicio de tu siguiente turno."
          },
          {
            id: "paladin:oath-of-devotion:lvl20:holy-nimbus",
            name: "Santo Nimbo",
            class: "paladin",
            level: 20,
            subclassId: "paladin:oath-of-devotion",
            subclassName: "Juramento de devoción",
            description: "Como acción adicional, puedes imbuir tu aura de protección con poder sagrado, otorgando los siguientes beneficios durante 10 minutos o hasta que los finalices (no se requiere ninguna acción). Una vez que uses esta función, no podrás volver a usarla hasta que termines un descanso prolongado. También puedes restaurar tu uso gastando un espacio de hechizo de nivel 5 (no se requiere ninguna acción).\n\nBarrio Santo. Tienes ventaja en cualquier tirada de salvación que te obligue a realizar un demonio o un no-muerto.\n\nDaño Radiante. Siempre que un enemigo comienza su turno en el aura, esa criatura recibe un daño Radiante igual a tu modificador de Carisma más tu Bonificación de Competencia.\n\nLuz del sol. El aura está llena de Luz Brillante que es la luz del sol."
          }
        ]
      }
    ]
  },
  ranger: {
    classId: "ranger",
    className: "Guardabosque",
    source: "Reglas gratuitas de D&D 2024",
    subclassUnlockLevel: 3,
    classFeatures: [
      {
        id: "ranger:lvl1:spellcasting:1",
        name: "Lanzamiento de hechizos",
        class: "ranger",
        level: 1,
        description: "Has aprendido a canalizar la esencia mágica de la naturaleza para lanzar hechizos. Consulta \"Hechizos\" para conocer las reglas sobre el lanzamiento de hechizos. La siguiente información detalla cómo se usan esas reglas con los hechizos de Guardabosques, que aparecen en la lista de hechizos de Guardabosques más adelante en la descripción de la clase.\n\nRanuras para hechizos. La tabla de características del guardabosques muestra cuántos espacios para hechizos tienes para lanzar tus hechizos de nivel 1+. Recuperas todos los espacios gastados cuando terminas un descanso prolongado.\n\nHechizos preparados de nivel 1+. Usted prepara la lista de hechizos de nivel 1+ que están disponibles para lanzar con esta función. Para empezar, elige dos hechizos de Ranger de nivel 1. Se recomiendan Cure Wounds y Ensnaring Strike.\n\nLa cantidad de hechizos en tu lista aumenta a medida que ganas niveles de Guardabosques, como se muestra en la columna Hechizos preparados de la tabla Características del Guardabosques. Siempre que ese número aumente, elige hechizos de Ranger adicionales hasta que el número de hechizos en tu lista coincida con el número en la tabla de Características del Ranger. Los hechizos elegidos deben ser de un nivel para el que tengas espacios para hechizos. Por ejemplo, si eres un Ranger de nivel 5, tu lista de hechizos preparados puede incluir seis hechizos de Ranger de nivel 1 o 2 en cualquier combinación.\n\nSi otra característica de Guardabosques te proporciona hechizos que siempre has preparado, esos hechizos no cuentan para el número de hechizos que puedes preparar con esta característica, pero esos hechizos cuentan como hechizos de Guardabosques para ti.\n\nCambiando tus hechizos preparados. Siempre que termines un descanso prolongado, puedes reemplazar un hechizo de tu lista con otro hechizo de Guardabosques para el que tengas espacios para hechizos.\n\nHabilidad de lanzar hechizos. La sabiduría es tu habilidad para lanzar hechizos para tus hechizos de Ranger.\n\nEnfoque de lanzamiento de hechizos. Puedes usar un enfoque druídico como enfoque de lanzamiento de hechizos para tus hechizos de guardabosques."
      },
      {
        id: "ranger:lvl1:favored-enemy:2",
        name: "Enemigo favorecido",
        class: "ranger",
        level: 1,
        description: "Siempre tienes preparado el hechizo Marca del Cazador. Puedes lanzarlo dos veces sin gastar un espacio de hechizo y recuperas todos los usos gastados de esta habilidad cuando terminas un descanso prolongado.\n\nEl número de veces que puedes lanzar el hechizo sin un espacio de hechizo aumenta cuando alcanzas ciertos niveles de Guardabosques, como se muestra en la columna Enemigo favorecido de la tabla Características del Guardabosques."
      },
      {
        id: "ranger:lvl1:weapon-mastery:3",
        name: "Dominio de armas",
        class: "ranger",
        level: 1,
        description: "Tu entrenamiento con armas te permite utilizar las propiedades de dominio de dos tipos de armas de tu elección con las que tienes competencia, como arcos largos y espadas cortas.\n\nCada vez que termines un descanso prolongado, podrás cambiar los tipos de armas que elegiste. Por ejemplo, podrías pasar a utilizar las propiedades de dominio de cimitarras y espadas largas."
      },
      {
        id: "ranger:lvl2:deft-explorer:1",
        name: "Explorador hábil",
        class: "ranger",
        level: 2,
        description: "Gracias a tus viajes, obtienes los siguientes beneficios.\n\nPericia. Elija una de sus habilidades con la que le falta experiencia. Obtienes experiencia en esa habilidad.\n\nIdiomas. Conoces dos idiomas de tu elección según las tablas de idiomas en “Creación de un personaje”."
      },
      {
        id: "ranger:lvl2:fighting-style:2",
        name: "Estilo de lucha",
        class: "ranger",
        level: 2,
        description: "Obtienes una dote de Estilo de lucha de tu elección (ver “Dotes”). En lugar de elegir una de esas hazañas, puedes elegir la opción a continuación.\n\nGuerrero druídico. Aprendes dos trucos de druida de tu elección (consulta la sección de clases de druida para obtener una lista de hechizos de druida). Se recomienda orientación y Starry Wisp. Los trucos elegidos cuentan como hechizos de Guardabosques para ti, y la Sabiduría es tu habilidad para lanzar hechizos para ellos. Siempre que ganes un nivel de Guardabosques, puedes reemplazar uno de estos trucos con otro truco de Druida."
      },
      {
        id: "ranger:lvl3:ranger-subclass:1",
        name: "Subclase de guardabosques",
        class: "ranger",
        level: 3,
        description: "Obtienes una subclase de Ranger de tu elección. La subclase Hunter se detalla después de la descripción de esta clase. Una subclase es una especialización que te otorga características en ciertos niveles de Ranger. Durante el resto de tu carrera, obtienes cada una de las características de tu subclase que sean de tu nivel de Guardabosques o inferior."
      },
      {
        id: "ranger:lvl4:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "ranger",
        level: 4,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de Guardabosques 8, 12 y 16."
      },
      {
        id: "ranger:lvl5:extra-attack:1",
        name: "Ataque extra",
        class: "ranger",
        level: 5,
        description: "Puedes atacar dos veces en lugar de una cada vez que realizas la acción de Atacar en tu turno."
      },
      {
        id: "ranger:lvl6:roving:1",
        name: "Errabundo",
        class: "ranger",
        level: 6,
        description: "Tu velocidad aumenta 10 pies mientras no llevas armadura pesada. También tienes una velocidad de ascenso y una velocidad de natación igual a tu velocidad."
      },
      {
        id: "ranger:lvl7:subclass-feature:1",
        name: "Característica de subclase",
        class: "ranger",
        level: 7
      },
      {
        id: "ranger:lvl8:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "ranger",
        level: 8,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de Guardabosques 8, 12 y 16."
      },
      {
        id: "ranger:lvl9:expertise:1",
        name: "Pericia",
        class: "ranger",
        level: 9,
        description: "Elige dos de tus habilidades con las que te falta experiencia. Obtienes experiencia en esas habilidades."
      },
      {
        id: "ranger:lvl10:tireless:1",
        name: "Incansable",
        class: "ranger",
        level: 10,
        description: "Las fuerzas primarias ahora te ayudan a impulsar tus viajes y te otorgan los siguientes beneficios.\n\nPuntos de vida temporales. Como acción mágica, puedes darte una cantidad de puntos de vida temporales igual a 1d8 más tu modificador de Sabiduría (mínimo de 1). Puedes usar esta acción una cantidad de veces igual a tu modificador de Sabiduría (mínimo una vez) y recuperas todos los usos gastados cuando terminas un Descanso Largo.\n\nDisminuir el agotamiento. Cada vez que finalizas un breve descanso, tu nivel de agotamiento, si lo hay, disminuye en 1."
      },
      {
        id: "ranger:lvl11:subclass-feature:1",
        name: "Característica de subclase",
        class: "ranger",
        level: 11
      },
      {
        id: "ranger:lvl12:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "ranger",
        level: 12,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de Guardabosques 8, 12 y 16."
      },
      {
        id: "ranger:lvl13:relentless-hunter:1",
        name: "Cazador implacable",
        class: "ranger",
        level: 13,
        description: "Recibir daño no puede romper tu concentración en Hunter's Mark."
      },
      {
        id: "ranger:lvl14:nature-s-veil:1",
        name: "Velo de la naturaleza",
        class: "ranger",
        level: 14,
        description: "Invocas a los espíritus de la naturaleza para que te ocultes mágicamente. Como acción adicional, puedes otorgarte la condición de Invisible hasta el final de tu próximo turno.\n\nPuedes usar esta característica una cantidad de veces igual a tu modificador de Sabiduría (mínimo una vez) y recuperas todos los usos gastados cuando terminas un Descanso Largo."
      },
      {
        id: "ranger:lvl15:subclass-feature:1",
        name: "Característica de subclase",
        class: "ranger",
        level: 15
      },
      {
        id: "ranger:lvl16:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "ranger",
        level: 16,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de Guardabosques 8, 12 y 16."
      },
      {
        id: "ranger:lvl17:precise-hunter:1",
        name: "Cazador preciso",
        class: "ranger",
        level: 17,
        description: "Tienes ventaja en las tiradas de ataque contra la criatura actualmente marcada por tu marca de cazador."
      },
      {
        id: "ranger:lvl18:feral-senses:1",
        name: "Sentidos salvajes",
        class: "ranger",
        level: 18,
        description: "Tu conexión con las fuerzas de la naturaleza te otorga Blindsight con un alcance de 30 pies."
      },
      {
        id: "ranger:lvl19:epic-boon:1",
        name: "Bendición épica",
        class: "ranger",
        level: 19,
        description: "Obtienes una dote de bendición épica (ver “Dotes”) u otra dote de tu elección para la cual calificas. Se recomienda la bendición de los viajes dimensionales."
      },
      {
        id: "ranger:lvl20:foe-slayer:1",
        name: "Asesino de enemigos",
        class: "ranger",
        level: 20,
        description: "El dado de daño de tu Marca del Cazador es un d10 en lugar de un d6."
      }
    ],
    subclasses: [
      {
        id: "ranger:hunter",
        name: "Cazador",
        classId: "ranger",
        unlockLevel: 3,
        source: "Reglas gratuitas de D&D 2024",
        features: [
          {
            id: "ranger:hunter:lvl3:hunter-s-lore",
            name: "La tradición del cazador",
            class: "ranger",
            level: 3,
            subclassId: "ranger:hunter",
            subclassName: "Cazador",
            description: "Puedes recurrir a las fuerzas de la naturaleza para revelar ciertas fortalezas y debilidades de tu presa. Mientras una criatura está marcada por tu Marca de Cazador, sabes si esa criatura tiene Inmunidades, Resistencias o Vulnerabilidades, y si la criatura tiene alguna, sabes cuáles son."
          },
          {
            id: "ranger:hunter:lvl3:hunter-s-prey",
            name: "La presa del cazador",
            class: "ranger",
            level: 3,
            subclassId: "ranger:hunter",
            subclassName: "Cazador",
            description: "Obtendrá una de las siguientes opciones de funciones de su elección. Cada vez que termines un Descanso Corto o Largo, podrás reemplazar la opción elegida por la otra.\n\nAsesino de colosos. Tu tenacidad puede desgastar incluso a los enemigos más resistentes. Cuando golpeas a una criatura con un arma, el arma causa 1d8 de daño adicional al objetivo si le falta alguno de sus puntos de vida. Puedes infligir este daño adicional solo una vez por turno.\n\nRompehordas. Una vez en cada uno de tus turnos, cuando realizas un ataque con un arma, puedes realizar otro ataque con la misma arma contra una criatura diferente que esté a 5 pies del objetivo original, que esté dentro del alcance del arma y que no hayas atacado este turno."
          },
          {
            id: "ranger:hunter:lvl7:defensive-tactics",
            name: "Tácticas defensivas",
            class: "ranger",
            level: 7,
            subclassId: "ranger:hunter",
            subclassName: "Cazador",
            description: "Obtendrá una de las siguientes opciones de funciones de su elección. Cada vez que termines un Descanso Corto o Largo, podrás reemplazar la opción elegida por la otra.\n\nEscapa de la Horda. Los ataques de oportunidad tienen desventajas en tu contra.\n\nDefensa multiataque. Cuando una criatura te golpea con una tirada de ataque, esa criatura tiene Desventaja en todas las demás tiradas de ataque contra ti este turno."
          },
          {
            id: "ranger:hunter:lvl11:superior-hunter-s-prey",
            name: "Presa del cazador superior",
            class: "ranger",
            level: 11,
            subclassId: "ranger:hunter",
            subclassName: "Cazador",
            description: "Una vez por turno, cuando infliges daño a una criatura marcada por tu Marca de Cazador, también puedes infligir el daño adicional de ese hechizo a una criatura diferente que puedas ver a menos de 30 pies de la primera criatura."
          },
          {
            id: "ranger:hunter:lvl15:superior-hunter-s-defense",
            name: "Defensa del cazador superior",
            class: "ranger",
            level: 15,
            subclassId: "ranger:hunter",
            subclassName: "Cazador",
            description: "Cuando recibes daño, puedes realizar una Reacción para darte Resistencia a ese daño y a cualquier otro daño del mismo tipo hasta el final del turno actual."
          }
        ]
      }
    ]
  },
  rogue: {
    classId: "rogue",
    className: "Pícaro",
    source: "Reglas gratuitas de D&D 2024",
    subclassUnlockLevel: 3,
    classFeatures: [
      {
        id: "rogue:lvl1:expertise:1",
        name: "Pericia",
        class: "rogue",
        level: 1,
        description: "Obtienes experiencia en dos de tus habilidades de tu elección. Se recomiendan juegos de manos y sigilo si los dominas.\n\nEn el nivel 6 de Pícaro, obtienes Experiencia en dos habilidades más de tu elección."
      },
      {
        id: "rogue:lvl1:sneak-attack:2",
        name: "Ataque furtivo",
        class: "rogue",
        level: 1,
        description: "Sabes cómo atacar sutilmente y aprovechar la distracción del enemigo. Una vez por turno, puedes infligir 1d6 de daño adicional a una criatura que golpeas con una tirada de ataque si tienes Ventaja en la tirada y el ataque usa una delicadeza o un arma a distancia. El tipo de daño adicional es el mismo que el tipo de arma.\n\nNo necesitas Ventaja en la tirada de ataque si al menos uno de tus aliados está a 5 pies del objetivo, el aliado no tiene la condición de Incapacitado y tú no tienes Desventaja en la tirada de ataque.\n\nEl daño adicional aumenta a medida que ganas niveles de Pícaro, como se muestra en la columna Ataque furtivo de la tabla de Características de Pícaro."
      },
      {
        id: "rogue:lvl1:thieves-cant:3",
        name: "El hipocresía de los ladrones",
        class: "rogue",
        level: 1,
        description: "Aprendiste varios idiomas en las comunidades donde ejercitaste tus talentos pícaros. Conoces el cant de los ladrones y otro idioma de tu elección, que eliges de las tablas de idiomas en “Creación de un personaje”."
      },
      {
        id: "rogue:lvl1:weapon-mastery:4",
        name: "Dominio de armas",
        class: "rogue",
        level: 1,
        description: "Tu entrenamiento con armas te permite utilizar las propiedades de dominio de dos tipos de armas de tu elección con las que tienes competencia, como dagas y arcos cortos.\n\nCada vez que termines un descanso prolongado, podrás cambiar los tipos de armas que elegiste. Por ejemplo, podrías pasar a utilizar las propiedades de dominio de Cimitarras y Espadas cortas."
      },
      {
        id: "rogue:lvl2:cunning-action:1",
        name: "Acción astuta",
        class: "rogue",
        level: 2,
        description: "Su rapidez de pensamiento y agilidad le permiten moverse y actuar con rapidez. En tu turno, puedes realizar una de las siguientes acciones como acción adicional: correr, desconectarse u ocultarse."
      },
      {
        id: "rogue:lvl3:rogue-subclass:1",
        name: "Subclase pícaro",
        class: "rogue",
        level: 3,
        description: "Obtienes una subclase de Pícaro de tu elección. La subclase Ladrón se detalla después de la descripción de esta clase. Una subclase es una especialización que te otorga características en ciertos niveles de Pícaro. Durante el resto de tu carrera, obtienes cada una de las características de tu subclase que sean de tu nivel Pícaro o inferior."
      },
      {
        id: "rogue:lvl3:steady-aim:2",
        name: "Objetivo constante",
        class: "rogue",
        level: 3,
        description: "Como acción adicional, te otorgas ventaja en tu próxima tirada de ataque en el turno actual. Puedes usar esta función solo si no te has movido durante este turno, y después de usarla, tu Velocidad es 0 hasta el final del turno actual."
      },
      {
        id: "rogue:lvl4:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "rogue",
        level: 4,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de Pícaro 8, 10, 12 y 16."
      },
      {
        id: "rogue:lvl5:cunning-strike:1",
        name: "Golpe astuto",
        class: "rogue",
        level: 5,
        description: "Has desarrollado formas astutas de utilizar tu ataque furtivo. Cuando infliges daño de ataque furtivo, puedes agregar uno de los siguientes efectos de golpe astuto. Cada efecto tiene un coste de dado, que es la cantidad de dados de daño de ataque furtivo que debes renunciar para agregar el efecto. Quitas el dado antes de tirarlo y el efecto se produce inmediatamente después de que se inflige el daño del ataque. Por ejemplo, si añades el efecto Veneno, elimina 1d6 del daño del ataque furtivo antes de tirar.\n\nSi un efecto de Golpe astuto requiere una tirada de salvación, la CD es igual a 8 más tu modificador de Destreza y Bonificación de Competencia.\n\nVeneno (Coste: 1d6). Agregas una toxina a tu golpe, lo que obliga al objetivo a realizar una tirada de salvación de Constitución. En caso de una salvación fallida, el objetivo tiene la condición de Envenenado durante 1 minuto. Al final de cada uno de sus turnos, el objetivo envenenado repite la salvación, finalizando el efecto sobre sí mismo si tiene éxito.\n\nPara utilizar este efecto, debes tener un kit de envenenamiento contigo.\n\nViaje (Coste: 1d6). Si el objetivo es Grande o más pequeño, debe superar una tirada de salvación de Destreza o tener la condición de Tendido.\n\nRetirar (Coste: 1d6). Inmediatamente después del ataque, te mueves hasta la mitad de tu Velocidad sin provocar Ataques de Oportunidad."
      },
      {
        id: "rogue:lvl5:uncanny-dodge:2",
        name: "Esquiva asombrosa",
        class: "rogue",
        level: 5,
        description: "Cuando un atacante que puedes ver te golpea con una tirada de ataque, puedes realizar una Reacción para reducir a la mitad el daño del ataque contra ti (redondeando hacia abajo)."
      },
      {
        id: "rogue:lvl6:expertise:1",
        name: "Pericia",
        class: "rogue",
        level: 6,
        description: "Obtienes experiencia en dos de tus habilidades de tu elección. Se recomiendan juegos de manos y sigilo si los dominas.\n\nEn el nivel 6 de Pícaro, obtienes Experiencia en dos habilidades más de tu elección."
      },
      {
        id: "rogue:lvl7:evasion:1",
        name: "Evasión",
        class: "rogue",
        level: 7,
        description: "Puedes esquivar ágilmente ciertos peligros. Cuando estás sujeto a un efecto que te permite realizar una tirada de salvación de Destreza para recibir solo la mitad del daño, no recibes daño si tienes éxito en la tirada de salvación y solo la mitad del daño si fallas. No puede utilizar esta función si tiene la condición de Incapacitado."
      },
      {
        id: "rogue:lvl7:reliable-talent:2",
        name: "Talento confiable",
        class: "rogue",
        level: 7,
        description: "Siempre que realices una prueba de habilidad que utilice una de tus habilidades o competencias con herramientas, puedes tratar una tirada de d20 de 9 o menos como un 10."
      },
      {
        id: "rogue:lvl8:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "rogue",
        level: 8,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de Pícaro 8, 10, 12 y 16."
      },
      {
        id: "rogue:lvl9:subclass-feature:1",
        name: "Característica de subclase",
        class: "rogue",
        level: 9
      },
      {
        id: "rogue:lvl10:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "rogue",
        level: 10,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de Pícaro 8, 10, 12 y 16."
      },
      {
        id: "rogue:lvl11:improved-cunning-strike:1",
        name: "Golpe astuto mejorado",
        class: "rogue",
        level: 11,
        description: "Puedes usar hasta dos efectos de Golpe astuto cuando infliges daño de Ataque furtivo, pagando el coste del dado por cada efecto."
      },
      {
        id: "rogue:lvl12:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "rogue",
        level: 12,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de Pícaro 8, 10, 12 y 16."
      },
      {
        id: "rogue:lvl13:subclass-feature:1",
        name: "Característica de subclase",
        class: "rogue",
        level: 13
      },
      {
        id: "rogue:lvl14:devious-strikes:1",
        name: "Golpes tortuosos",
        class: "rogue",
        level: 14,
        description: "Has practicado nuevas formas de utilizar tu ataque furtivo de manera tortuosa. Los siguientes efectos ahora se encuentran entre tus opciones de Golpe astuto.\n\nAturdimiento (Coste: 2d6). El objetivo debe superar una tirada de salvación de Constitución, o en su siguiente turno, sólo podrá hacer una de las siguientes cosas: moverse o realizar una acción o una acción adicional.\n\nNoquear (Costo: 6d6). El objetivo debe superar una tirada de salvación de Constitución, o quedará en estado de Inconsciencia durante 1 minuto o hasta que reciba algún daño. El objetivo inconsciente repite la salvación al final de cada uno de sus turnos, finalizando el efecto sobre sí mismo si tiene éxito.\n\nOscuro (Coste: 3d6). El objetivo debe superar una tirada de salvación de Destreza o quedará cegado hasta el final de su siguiente turno."
      },
      {
        id: "rogue:lvl15:slippery-mind:1",
        name: "Mente resbaladiza",
        class: "rogue",
        level: 15,
        description: "Tu mente astuta es excepcionalmente difícil de controlar. Obtienes competencia en las tiradas de salvación de Sabiduría y Carisma."
      },
      {
        id: "rogue:lvl16:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "rogue",
        level: 16,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de Pícaro 8, 10, 12 y 16."
      },
      {
        id: "rogue:lvl17:subclass-feature:1",
        name: "Característica de subclase",
        class: "rogue",
        level: 17
      },
      {
        id: "rogue:lvl18:elusive:1",
        name: "Elusivo",
        class: "rogue",
        level: 18,
        description: "Eres tan evasivo que los atacantes rara vez ganan terreno contra ti. Ninguna tirada de ataque puede tener Ventaja contra ti a menos que tengas la condición de Incapacitado."
      },
      {
        id: "rogue:lvl19:epic-boon:1",
        name: "Bendición épica",
        class: "rogue",
        level: 19,
        description: "Obtienes una dote de bendición épica (ver “Dotes”) u otra dote de tu elección para la cual calificas. Se recomienda la bendición del espíritu nocturno."
      },
      {
        id: "rogue:lvl20:stroke-of-luck:1",
        name: "Golpe de suerte",
        class: "rogue",
        level: 20,
        description: "Tienes una maravillosa habilidad para triunfar cuando lo necesitas. Si fallas una prueba D20, puedes convertir la tirada en un 20.\n\nUna vez que uses esta función, no podrás volver a usarla hasta que termines un Descanso Corto o Largo."
      }
    ],
    subclasses: [
      {
        id: "rogue:thief",
        name: "Ladrón",
        classId: "rogue",
        unlockLevel: 3,
        source: "Reglas gratuitas de D&D 2024",
        features: [
          {
            id: "rogue:thief:lvl3:fast-hands",
            name: "manos rapidas",
            class: "rogue",
            level: 3,
            subclassId: "rogue:thief",
            subclassName: "Ladrón",
            description: "Como acción adicional, puedes realizar una de las siguientes acciones.\n\nPrestidigitación. Haz una prueba de Destreza (Juego de manos) para abrir una cerradura o desarmar una trampa con herramientas de ladrón o para robar un bolsillo.\n\nUtilice un objeto. Realiza la acción Utilizar o realiza la acción Mágica para usar un objeto mágico que requiera esa acción."
          },
          {
            id: "rogue:thief:lvl3:second-story-work",
            name: "Trabajo del segundo piso",
            class: "rogue",
            level: 3,
            subclassId: "rogue:thief",
            subclassName: "Ladrón",
            description: "Te has entrenado para llegar a lugares especialmente difíciles de alcanzar, lo que te otorga estos beneficios.\n\nTrepador. Obtienes una velocidad de ascenso igual a tu velocidad.\n\nSaltador. Puedes determinar la distancia de tu salto usando tu Destreza en lugar de tu Fuerza."
          },
          {
            id: "rogue:thief:lvl9:supreme-sneak",
            name: "Furtivo Supremo",
            class: "rogue",
            level: 9,
            subclassId: "rogue:thief",
            subclassName: "Ladrón",
            description: "Obtienes la siguiente opción de Golpe astuto.\n\nAtaque sigiloso (Coste: 1d6). Si tienes la condición Invisible de la acción Ocultar, este ataque no finaliza esa condición si terminas el turno detrás de Cobertura Tres Cuartos o Cobertura Total."
          },
          {
            id: "rogue:thief:lvl13:use-magic-device",
            name: "Usar dispositivo mágico",
            class: "rogue",
            level: 13,
            subclassId: "rogue:thief",
            subclassName: "Ladrón",
            description: "Has aprendido cómo maximizar el uso de objetos mágicos, otorgándote los siguientes beneficios.\n\nSintonía. Puedes sintonizar hasta cuatro objetos mágicos a la vez.\n\nCargos. Siempre que uses la propiedad de un objeto mágico que gasta cargas, tira 1d6. Con un resultado de 6, utilizas la propiedad sin gastar los cargos.\n\nRollos. Puedes usar cualquier Pergamino de hechizo, usando la Inteligencia como tu habilidad de lanzamiento de hechizos para el hechizo. Si el hechizo es un truco o un hechizo de nivel 1, puedes lanzarlo de manera confiable. Si el pergamino contiene un hechizo de nivel superior, primero debes superar una prueba de Inteligencia (Arcanos) (CD 10 más el nivel del hechizo). Con una prueba exitosa, lanzas el hechizo desde el pergamino. Si falla la prueba, el pergamino se desintegra."
          },
          {
            id: "rogue:thief:lvl17:thief-s-reflexes",
            name: "Los reflejos del ladrón",
            class: "rogue",
            level: 17,
            subclassId: "rogue:thief",
            subclassName: "Ladrón",
            description: "Eres experto en tender emboscadas y escapar rápidamente del peligro. Puedes realizar dos turnos durante la primera ronda de cualquier combate. Tomas tu primer turno con tu Iniciativa normal y el segundo turno con tu Iniciativa menos 10."
          }
        ]
      }
    ]
  },
  sorcerer: {
    classId: "sorcerer",
    className: "Hechicero",
    source: "Reglas gratuitas de D&D 2024",
    subclassUnlockLevel: 3,
    classFeatures: [
      {
        id: "sorcerer:lvl1:spellcasting:1",
        name: "Lanzamiento de hechizos",
        class: "sorcerer",
        level: 1,
        description: "Aprovechando tu magia innata, puedes lanzar hechizos. Consulta \"Hechizos\" para conocer las reglas sobre el lanzamiento de hechizos. La siguiente información detalla cómo usas esas reglas con los hechizos de Hechicero, que aparecen en la lista de hechizos de Hechicero más adelante en la descripción de la clase.\n\nTrucos. Conoces cuatro trucos de hechicero de tu elección. Se recomiendan Luz, Prestidigitación, Agarre impactante y Explosión hechicera. Siempre que ganes un nivel de Hechicero, puedes reemplazar uno de tus trucos de esta función con otro truco de Hechicero de tu elección.\n\nCuando alcanzas los niveles 4 y 10 de Hechicero, aprendes otro truco de Hechicero de tu elección, como se muestra en la columna Trucos de la tabla Características de Hechicero.\n\nRanuras para hechizos. La tabla de características del hechicero muestra cuántos espacios para hechizos tienes para lanzar tus hechizos de nivel 1+. Recuperas todos los espacios gastados cuando terminas un descanso prolongado.\n\nHechizos preparados de nivel 1+. Usted prepara la lista de hechizos de nivel 1+ que están disponibles para lanzar con esta función. Para empezar, elige dos hechizos de Hechicero de nivel 1. Se recomiendan Burning Hands y Detect Magic.\n\nLa cantidad de hechizos en tu lista aumenta a medida que ganas niveles de Hechicero, como se muestra en la columna Hechizos preparados de la tabla Características de Hechicero. Siempre que ese número aumente, elige hechizos de Hechicero adicionales hasta que el número de hechizos de tu lista coincida con el número de la tabla de Características de Hechicero. Los hechizos elegidos deben ser de un nivel para el que tengas espacios para hechizos. Por ejemplo, si eres un Hechicero de nivel 3, tu lista de hechizos preparados puede incluir seis hechizos de Hechicero de nivel 1 o 2 en cualquier combinación.\n\nSi otra característica de Hechicero te proporciona hechizos que siempre has preparado, esos hechizos no cuentan para el número de hechizos que puedes preparar con esta característica, pero esos hechizos cuentan como hechizos de Hechicero para ti.\n\nCambiando tus hechizos preparados. Siempre que ganes un nivel de Hechicero, puedes reemplazar un hechizo de tu lista con otro hechizo de Hechicero para el que tengas espacios para hechizos.\n\nHabilidad de lanzar hechizos. El carisma es tu habilidad para lanzar hechizos para tus hechizos de Hechicero.\n\nEnfoque de lanzamiento de hechizos. Puedes usar un enfoque arcano como enfoque de lanzamiento de hechizos para tus hechizos de Hechicero."
      },
      {
        id: "sorcerer:lvl1:innate-sorcery:2",
        name: "Hechicería innata",
        class: "sorcerer",
        level: 1,
        description: "Un evento en tu pasado dejó una marca indeleble en ti, infundiéndote una magia hirviendo. Como acción adicional, puedes desatar esa magia durante 1 minuto, durante el cual obtienes los siguientes beneficios:\n\nPuedes usar esta función dos veces y recuperarás todos los usos gastados cuando termines un descanso prolongado."
      },
      {
        id: "sorcerer:lvl2:font-of-magic:1",
        name: "fuente de magia",
        class: "sorcerer",
        level: 2,
        description: "Puedes aprovechar la fuente de la magia dentro de ti. Esta fuente está representada por Puntos de Hechicería, que te permiten crear una variedad de efectos mágicos.\n\nTienes 2 puntos de hechicería y ganas más a medida que alcanzas niveles más altos, como se muestra en la columna de puntos de hechicería de la tabla de características del hechicero. No puedes tener más puntos de brujería que el número que se muestra en la tabla para tu nivel. Recuperas todos los puntos de hechicería gastados cuando terminas un descanso prolongado.\n\nPuedes usar tus puntos de brujería para impulsar las siguientes opciones, junto con otras funciones, como Metamagic, que usan esos puntos.\n\nConvertir espacios para hechizos en puntos de hechicería. Puedes gastar un espacio de hechizo para ganar una cantidad de puntos de hechicería igual al nivel del espacio (no se requiere ninguna acción).\n\nCreando espacios para hechizos. Como acción adicional, puedes transformar los puntos de brujería no gastados en un espacio para hechizo. La tabla de Creación de espacios para hechizos muestra el costo de crear un espacio para hechizos de un nivel determinado y enumera el nivel mínimo de Hechicero que debes tener para crear un espacio. Puedes crear un espacio para hechizos que no supere el nivel 5.\n\nCualquier espacio para hechizos que crees con esta función desaparece cuando finalizas un descanso prolongado."
      },
      {
        id: "sorcerer:lvl2:metamagic:2",
        name: "metamagia",
        class: "sorcerer",
        level: 2,
        description: "Debido a que tu magia fluye desde dentro, puedes alterar tus hechizos para adaptarlos a tus necesidades; obtienes dos opciones metamágicas de tu elección en \"Opciones metamágicas\" más adelante en la descripción de esta clase. Usas las opciones elegidas para modificar temporalmente los hechizos que lanzas. Para utilizar una opción, debes gastar la cantidad de puntos de hechicería que cuesta.\n\nPuedes usar sólo una opción Metamágica en un hechizo cuando lo lanzas a menos que se indique lo contrario en una de esas opciones.\n\nSiempre que ganes un nivel de Hechicero, puedes reemplazar una de tus opciones metamágicas por una que no conoces. Obtienes dos opciones más en el nivel de Hechicero 10 y dos más en el nivel de Hechicero 17."
      },
      {
        id: "sorcerer:lvl3:sorcerer-subclass:1",
        name: "Subclase de hechicero",
        class: "sorcerer",
        level: 3,
        description: "Obtienes una subclase de Hechicero de tu elección. La subclase Draconic Sorcery se detalla después de la descripción de esta clase. Una subclase es una especialización que te otorga características en ciertos niveles de Hechicero. Durante el resto de tu carrera, obtienes cada una de las características de tu subclase que sean de tu nivel de Hechicero o inferior."
      },
      {
        id: "sorcerer:lvl4:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "sorcerer",
        level: 4,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de Hechicero 8, 12 y 16."
      },
      {
        id: "sorcerer:lvl5:sorcerous-restoration:1",
        name: "Restauración hechicera",
        class: "sorcerer",
        level: 5,
        description: "Cuando terminas un breve descanso, puedes recuperar los puntos de hechicería gastados, pero no más de un número igual a la mitad de tu nivel de hechicero (redondeando hacia abajo). Una vez que uses esta función, no podrás volver a hacerlo hasta que termines un descanso prolongado."
      },
      {
        id: "sorcerer:lvl6:subclass-feature:1",
        name: "Característica de subclase",
        class: "sorcerer",
        level: 6
      },
      {
        id: "sorcerer:lvl7:sorcery-incarnate:1",
        name: "Hechicería encarnada",
        class: "sorcerer",
        level: 7,
        description: "Si no te quedan usos de la Hechicería Innata, puedes usarla si gastas 2 Puntos de Hechicería cuando realizas la Acción Bonus para activarla.\n\nAdemás, mientras tu función de Hechicería Innata está activa, puedes usar hasta dos de tus opciones Metamágicas en cada hechizo que lances."
      },
      {
        id: "sorcerer:lvl8:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "sorcerer",
        level: 8,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de Hechicero 8, 12 y 16."
      },
      {
        id: "sorcerer:lvl9:feature:1",
        name: "—",
        class: "sorcerer",
        level: 9
      },
      {
        id: "sorcerer:lvl10:metamagic:1",
        name: "metamagia",
        class: "sorcerer",
        level: 10,
        description: "Debido a que tu magia fluye desde dentro, puedes alterar tus hechizos para adaptarlos a tus necesidades; obtienes dos opciones metamágicas de tu elección en \"Opciones metamágicas\" más adelante en la descripción de esta clase. Usas las opciones elegidas para modificar temporalmente los hechizos que lanzas. Para utilizar una opción, debes gastar la cantidad de puntos de hechicería que cuesta.\n\nPuedes usar sólo una opción Metamágica en un hechizo cuando lo lanzas a menos que se indique lo contrario en una de esas opciones.\n\nSiempre que ganes un nivel de Hechicero, puedes reemplazar una de tus opciones metamágicas por una que no conoces. Obtienes dos opciones más en el nivel de Hechicero 10 y dos más en el nivel de Hechicero 17."
      },
      {
        id: "sorcerer:lvl11:feature:1",
        name: "—",
        class: "sorcerer",
        level: 11
      },
      {
        id: "sorcerer:lvl12:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "sorcerer",
        level: 12,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de Hechicero 8, 12 y 16."
      },
      {
        id: "sorcerer:lvl13:feature:1",
        name: "—",
        class: "sorcerer",
        level: 13
      },
      {
        id: "sorcerer:lvl14:subclass-feature:1",
        name: "Característica de subclase",
        class: "sorcerer",
        level: 14
      },
      {
        id: "sorcerer:lvl15:feature:1",
        name: "—",
        class: "sorcerer",
        level: 15
      },
      {
        id: "sorcerer:lvl16:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "sorcerer",
        level: 16,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de Hechicero 8, 12 y 16."
      },
      {
        id: "sorcerer:lvl17:metamagic:1",
        name: "metamagia",
        class: "sorcerer",
        level: 17,
        description: "Debido a que tu magia fluye desde dentro, puedes alterar tus hechizos para adaptarlos a tus necesidades; obtienes dos opciones metamágicas de tu elección en \"Opciones metamágicas\" más adelante en la descripción de esta clase. Usas las opciones elegidas para modificar temporalmente los hechizos que lanzas. Para utilizar una opción, debes gastar la cantidad de puntos de hechicería que cuesta.\n\nPuedes usar sólo una opción Metamágica en un hechizo cuando lo lanzas a menos que se indique lo contrario en una de esas opciones.\n\nSiempre que ganes un nivel de Hechicero, puedes reemplazar una de tus opciones metamágicas por una que no conoces. Obtienes dos opciones más en el nivel de Hechicero 10 y dos más en el nivel de Hechicero 17."
      },
      {
        id: "sorcerer:lvl18:subclass-feature:1",
        name: "Característica de subclase",
        class: "sorcerer",
        level: 18
      },
      {
        id: "sorcerer:lvl19:epic-boon:1",
        name: "Bendición épica",
        class: "sorcerer",
        level: 19,
        description: "Obtienes una dote de bendición épica (ver “Dotes”) u otra dote de tu elección para la cual calificas. Se recomienda la bendición de los viajes dimensionales."
      },
      {
        id: "sorcerer:lvl20:arcane-apotheosis:1",
        name: "Apoteosis Arcana",
        class: "sorcerer",
        level: 20
      }
    ],
    subclasses: [
      {
        id: "sorcerer:draconic-sorcery",
        name: "Hechicería dracónica",
        classId: "sorcerer",
        unlockLevel: 3,
        source: "Reglas gratuitas de D&D 2024",
        features: [
          {
            id: "sorcerer:draconic-sorcery:lvl3:draconic-resilience",
            name: "Resiliencia dracónica",
            class: "sorcerer",
            level: 3,
            subclassId: "sorcerer:draconic-sorcery",
            subclassName: "Hechicería dracónica",
            description: "La magia en tu cuerpo manifiesta los rasgos físicos de tu don dracónico. Tu máximo de puntos de vida aumenta en 3 y aumenta en 1 cada vez que ganas otro nivel de Hechicero.\n\nAlgunas partes de ti también están cubiertas por escamas parecidas a las de un dragón. Mientras no uses armadura, tu Clase de Armadura base es igual a 10 más tus modificadores de Destreza y Carisma."
          },
          {
            id: "sorcerer:draconic-sorcery:lvl3:draconic-spells",
            name: "Hechizos dracónicos",
            class: "sorcerer",
            level: 3,
            subclassId: "sorcerer:draconic-sorcery",
            subclassName: "Hechicería dracónica",
            description: "Cuando alcanzas un nivel de Hechicero especificado en la tabla de Hechizos Draconicos, a partir de entonces siempre tendrás preparados los hechizos enumerados."
          },
          {
            id: "sorcerer:draconic-sorcery:lvl6:elemental-affinity",
            name: "Afinidad elemental",
            class: "sorcerer",
            level: 6,
            subclassId: "sorcerer:draconic-sorcery",
            subclassName: "Hechicería dracónica",
            description: "Tu magia dracónica tiene afinidad con un tipo de daño asociado con los dragones. Elija uno de esos tipos: Ácido, Frío, Fuego, Rayo o Veneno.\n\nTienes resistencia a ese tipo de daño, y cuando lanzas un hechizo que causa daño de ese tipo, puedes agregar tu modificador de Carisma a una tirada de daño de ese hechizo."
          },
          {
            id: "sorcerer:draconic-sorcery:lvl14:dragon-wings",
            name: "Alas de dragón",
            class: "sorcerer",
            level: 14,
            subclassId: "sorcerer:draconic-sorcery",
            subclassName: "Hechicería dracónica",
            description: "Como acción adicional, puedes hacer que aparezcan alas dracónicas en tu espalda. Las alitas duran 1 hora o hasta que las despidas (no se requiere ninguna acción). Mientras dura, tienes una velocidad de vuelo de 60 pies.\n\nUna vez que uses esta función, no podrás volver a usarla hasta que termines un Descanso prolongado a menos que gastes 3 puntos de hechicería (no se requiere ninguna acción) para restaurar tu uso."
          },
          {
            id: "sorcerer:draconic-sorcery:lvl18:dragon-companion",
            name: "Compañero Dragón",
            class: "sorcerer",
            level: 18,
            subclassId: "sorcerer:draconic-sorcery",
            subclassName: "Hechicería dracónica",
            description: "Puedes lanzar Invocar Dragón sin un componente Material. También puedes lanzarlo una vez sin un espacio de hechizo, y recuperas la capacidad de lanzarlo de esta manera cuando terminas un Descanso Largo.\n\nCada vez que empieces a lanzar el hechizo, podrás modificarlo para que no requiera Concentración. Si lo haces, la duración del hechizo pasa a ser de 1 minuto para ese lanzamiento."
          }
        ]
      }
    ]
  },
  warlock: {
    classId: "warlock",
    className: "Brujo",
    source: "Reglas gratuitas de D&D 2024",
    subclassUnlockLevel: 3,
    classFeatures: [
      {
        id: "warlock:lvl1:eldritch-invocations:1",
        name: "Invocaciones sobrenaturales",
        class: "warlock",
        level: 1,
        description: "Has desenterrado invocaciones sobrenaturales, piezas de conocimiento prohibido que te otorgan una habilidad mágica duradera u otras lecciones. Obtienes una invocación de tu elección, como Pacto del Tomo. Las invocaciones se describen en la sección \"Opciones de invocación sobrenatural\" más adelante en la descripción de esta clase.\n\nRequisitos previos. Si una invocación tiene un requisito previo, debes cumplirlo para aprender esa invocación. Por ejemplo, si una invocación requiere que seas un brujo de nivel 5+, puedes seleccionar la invocación una vez que alcances el nivel 5 de brujo.\n\nReemplazo y obtención de invocaciones. Siempre que ganes un nivel de Brujo, podrás reemplazar una de tus invocaciones por otra para la que califiques. No puedes reemplazar una invocación si es un requisito previo para otra invocación que tengas.\n\nCuando obtienes ciertos niveles de brujo, obtienes más invocaciones de tu elección, como se muestra en la columna Invocaciones de la tabla Características de brujo.\n\nNo puedes elegir la misma invocación más de una vez a menos que su descripción indique lo contrario."
      },
      {
        id: "warlock:lvl1:pact-magic:2",
        name: "Pacto mágico",
        class: "warlock",
        level: 1,
        description: "A través de una ceremonia oculta, has formado un pacto con una entidad misteriosa para obtener poderes mágicos. La entidad es una voz en las sombras (su identidad no está clara), pero su beneficio para ti es concreto: la capacidad de lanzar hechizos. Consulta \"Hechizos\" para conocer las reglas sobre el lanzamiento de hechizos. La siguiente información detalla cómo se usan esas reglas con los hechizos de Brujo, que aparecen en la lista de hechizos de Brujo más adelante en la descripción de la clase.\n\nTrucos. Conoces dos trucos de brujo de tu elección. Se recomiendan Eldritch Blast y Prestidigitación. Siempre que ganes un nivel de Brujo, puedes reemplazar uno de tus trucos de esta función con otro truco de Brujo de tu elección.\n\nCuando alcanzas los niveles 4 y 10 de Brujo, aprendes otro truco de Brujo de tu elección, como se muestra en la columna Trucos de la tabla Características de Brujo.\n\nRanuras para hechizos. La tabla de características de Warlock muestra cuántos espacios para hechizos tienes para lanzar tus hechizos de Warlock de los niveles 1 a 5. La tabla también muestra el nivel de esos espacios, todos los cuales son del mismo nivel. Recuperas todos los espacios para hechizos de Pact Magic gastados cuando terminas un Descanso Corto o Largo.\n\nPor ejemplo, cuando eres un brujo de nivel 5, tienes dos espacios para hechizos de nivel 3. Para lanzar el hechizo de nivel 1 Witch Bolt, debes gastar uno de esos espacios y lo lanzas como un hechizo de nivel 3.\n\nHechizos preparados de nivel 1+. Usted prepara la lista de hechizos de nivel 1+ que están disponibles para lanzar con esta función. Para empezar, elige dos hechizos de brujo de nivel 1. Se recomiendan Charm Person y Hex.\n\nLa cantidad de hechizos en tu lista aumenta a medida que ganas niveles de brujo, como se muestra en la columna Hechizos preparados de la tabla Características de brujo. Siempre que ese número aumente, elige hechizos de brujo adicionales hasta que el número de hechizos de tu lista coincida con el número de la tabla. Los hechizos elegidos no deben tener un nivel superior al que se muestra en la columna Nivel de ranura de la tabla para tu nivel. Cuando alcanzas el nivel 6, por ejemplo, aprendes un nuevo hechizo de Brujo, que puede ser de los niveles 1 a 3.\n\nSi otra característica de Brujo te proporciona hechizos que siempre has preparado, esos hechizos no cuentan para la cantidad de hechizos que puedes preparar con esta característica, pero esos hechizos cuentan como hechizos de Brujo para ti.\n\nCambiando tus hechizos preparados. Siempre que ganes un nivel de Brujo, puedes reemplazar un hechizo de tu lista con otro hechizo de Brujo de un nivel elegible.\n\nHabilidad de lanzar hechizos. Carisma es la habilidad de lanzar hechizos para tus hechizos de Brujo.\n\nEnfoque de lanzamiento de hechizos. Puedes usar un enfoque arcano como enfoque de lanzamiento de hechizos para tus hechizos de brujo."
      },
      {
        id: "warlock:lvl2:magical-cunning:1",
        name: "Astucia mágica",
        class: "warlock",
        level: 2,
        description: "Puedes realizar un rito esotérico durante 1 minuto. Al final, recuperas los espacios para hechizos de Pact Magic gastados, pero no más de un número igual a la mitad de tu máximo (redondeando hacia arriba). Una vez que uses esta función, no podrás volver a hacerlo hasta que termines un descanso prolongado."
      },
      {
        id: "warlock:lvl3:warlock-subclass:1",
        name: "Subclase de brujo",
        class: "warlock",
        level: 3,
        description: "Obtienes una subclase de Brujo de tu elección. La subclase Fiend Patron se detalla después de la descripción de esta clase. Una subclase es una especialización que te otorga funciones en ciertos niveles de brujo. Durante el resto de tu carrera, obtienes cada una de las características de tu subclase que sean de tu nivel de Brujo o inferior."
      },
      {
        id: "warlock:lvl4:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "warlock",
        level: 4,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles 8, 12 y 16 de Warlock."
      },
      {
        id: "warlock:lvl5:feature:1",
        name: "—",
        class: "warlock",
        level: 5
      },
      {
        id: "warlock:lvl6:subclass-feature:1",
        name: "Característica de subclase",
        class: "warlock",
        level: 6
      },
      {
        id: "warlock:lvl7:feature:1",
        name: "—",
        class: "warlock",
        level: 7
      },
      {
        id: "warlock:lvl8:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "warlock",
        level: 8,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles 8, 12 y 16 de Warlock."
      },
      {
        id: "warlock:lvl9:contact-patron:1",
        name: "Contactar al patrón",
        class: "warlock",
        level: 9,
        description: "En el pasado, normalmente contactabas a tu mecenas a través de intermediarios. Ahora puedes comunicarte directamente; siempre tienes preparado el hechizo Contactar con otro plano. Con esta característica, puedes lanzar el hechizo sin gastar un espacio de hechizo para contactar a tu patrón, y automáticamente tienes éxito en la tirada de salvación del hechizo.\n\nUna vez que lanzas el hechizo con esta característica, no podrás volver a hacerlo de esta manera hasta que termines un Descanso Largo."
      },
      {
        id: "warlock:lvl10:subclass-feature:1",
        name: "Característica de subclase",
        class: "warlock",
        level: 10
      },
      {
        id: "warlock:lvl11:mystic-arcanum-level-6-spell:1",
        name: "Arcano Místico (hechizo de nivel 6)",
        class: "warlock",
        level: 11
      },
      {
        id: "warlock:lvl12:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "warlock",
        level: 12,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles 8, 12 y 16 de Warlock."
      },
      {
        id: "warlock:lvl13:mystic-arcanum-level-7-spell:1",
        name: "Arcano Místico (hechizo de nivel 7)",
        class: "warlock",
        level: 13
      },
      {
        id: "warlock:lvl14:subclass-feature:1",
        name: "Característica de subclase",
        class: "warlock",
        level: 14
      },
      {
        id: "warlock:lvl15:mystic-arcanum-level-8-spell:1",
        name: "Arcano Místico (hechizo de nivel 8)",
        class: "warlock",
        level: 15
      },
      {
        id: "warlock:lvl16:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "warlock",
        level: 16,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles 8, 12 y 16 de Warlock."
      },
      {
        id: "warlock:lvl17:mystic-arcanum-level-9-spell:1",
        name: "Arcano Místico (hechizo de nivel 9)",
        class: "warlock",
        level: 17
      },
      {
        id: "warlock:lvl18:feature:1",
        name: "—",
        class: "warlock",
        level: 18
      },
      {
        id: "warlock:lvl19:epic-boon:1",
        name: "Bendición épica",
        class: "warlock",
        level: 19,
        description: "Obtienes una dote de bendición épica (ver “Dotes”) u otra dote de tu elección para la cual calificas. Se recomienda la bendición del destino."
      },
      {
        id: "warlock:lvl20:eldritch-master:1",
        name: "Maestro sobrenatural",
        class: "warlock",
        level: 20,
        description: "Cuando usas tu función de Astucia Mágica, recuperas todos los espacios para hechizos de Pact Magic gastados."
      }
    ],
    subclasses: [
      {
        id: "warlock:fiend-patron",
        name: "Patrón demonio",
        classId: "warlock",
        unlockLevel: 3,
        source: "Reglas gratuitas de D&D 2024",
        features: [
          {
            id: "warlock:fiend-patron:lvl3:dark-one-s-blessing",
            name: "La bendición del Oscuro",
            class: "warlock",
            level: 3,
            subclassId: "warlock:fiend-patron",
            subclassName: "Patrón demonio",
            description: "Cuando reduces a un enemigo a 0 puntos de vida, obtienes puntos de vida temporales iguales a tu modificador de carisma más tu nivel de brujo (mínimo de 1 punto de vida temporal). También obtienes este beneficio si alguien reduce a un enemigo a 10 pies de ti a 0 puntos de vida."
          },
          {
            id: "warlock:fiend-patron:lvl3:fiend-spells",
            name: "Hechizos demoníacos",
            class: "warlock",
            level: 3,
            subclassId: "warlock:fiend-patron",
            subclassName: "Patrón demonio",
            description: "La magia de tu patrón asegura que siempre tengas ciertos hechizos listos; Cuando alcanzas un nivel de Brujo especificado en la tabla de Hechizos de Demonio, a partir de entonces siempre tendrás preparados los hechizos enumerados."
          },
          {
            id: "warlock:fiend-patron:lvl6:dark-one-s-own-luck",
            name: "La propia suerte del oscuro",
            class: "warlock",
            level: 6,
            subclassId: "warlock:fiend-patron",
            subclassName: "Patrón demonio",
            description: "Puedes recurrir a tu diabólico patrón para alterar el destino a tu favor. Cuando realizas una prueba de habilidad o una tirada de salvación, puedes usar esta función para agregar 1d10 a tu tirada. Puedes hacerlo después de ver la tirada pero antes de que se produzca cualquiera de sus efectos.\n\nPuedes usar esta característica una cantidad de veces igual a tu modificador de Carisma (mínimo una vez), pero no puedes usarla más de una vez por tirada. Recuperas todos los usos gastados cuando terminas un Descanso Largo."
          },
          {
            id: "warlock:fiend-patron:lvl10:fiendish-resilience",
            name: "Resiliencia diabólica",
            class: "warlock",
            level: 10,
            subclassId: "warlock:fiend-patron",
            subclassName: "Patrón demonio",
            description: "Elige un tipo de daño, que no sea Fuerza, cada vez que termines un Descanso Corto o Largo. Tienes resistencia a ese tipo de daño hasta que elijas uno diferente con esta característica."
          },
          {
            id: "warlock:fiend-patron:lvl14:hurl-through-hell",
            name: "Lanzarse a través del infierno",
            class: "warlock",
            level: 14,
            subclassId: "warlock:fiend-patron",
            subclassName: "Patrón demonio",
            description: "Una vez por turno, cuando golpeas a una criatura con una tirada de ataque, puedes intentar transportar instantáneamente al objetivo a través de los Planos Inferiores. El objetivo debe superar una tirada de salvación de Carisma contra la CD de salvación de tu hechizo, o el objetivo desaparecerá y se lanzará a través de un paisaje de pesadilla. El objetivo sufre 8d10 de daño psíquico si no es un Demonio, y tiene la condición de Incapacitado hasta el final de tu siguiente turno, cuando regresa al espacio que ocupaba anteriormente o al espacio desocupado más cercano.\n\nUna vez que uses esta función, no podrás volver a usarla hasta que termines un Descanso prolongado a menos que gastes un espacio de hechizo de Pact Magic (no se requiere ninguna acción) para restaurar tu uso."
          }
        ]
      }
    ]
  },
  wizard: {
    classId: "wizard",
    className: "Mago",
    source: "Reglas gratuitas de D&D 2024",
    subclassUnlockLevel: 3,
    classFeatures: [
      {
        id: "wizard:lvl1:spellcasting:1",
        name: "Lanzamiento de hechizos",
        class: "wizard",
        level: 1,
        description: "Como estudiante de magia arcana, has aprendido a lanzar hechizos. Consulta \"Hechizos\" para conocer las reglas sobre el lanzamiento de hechizos. La siguiente información detalla cómo usas esas reglas con los hechizos de Mago, que aparecen en la lista de hechizos de Mago más adelante en la descripción de la clase.\n\nTrucos. Conoces tres trucos de mago de tu elección. Se recomiendan Luz, Mano de mago y Rayo de escarcha. Siempre que termines un Descanso Largo, puedes reemplazar uno de tus trucos de esta función con otro truco del Asistente de tu elección.\n\nCuando alcanzas los niveles 4 y 10 del Asistente, aprendes otro truco del Asistente de tu elección, como se muestra en la columna Trucos de la tabla Funciones del Asistente.\n\nLibro de hechizos. Tu aprendizaje mágico culminó con la creación de un libro único: tu libro de hechizos. Es un objeto diminuto que pesa 3 libras, contiene 100 páginas y solo usted o alguien que emita Identificar puede leerlo. Usted determina la apariencia y los materiales del libro, como un tomo con bordes dorados o una colección de vitela encuadernada con cordel.\n\nEl libro contiene los hechizos de nivel 1+ que conoces. Comienza con seis hechizos de mago de nivel 1 de tu elección. Se recomiendan Detectar magia, Caída de plumas, Armadura de mago, Misil mágico, Sueño y Onda de trueno.\n\nSiempre que ganes un nivel de Mago después de 1, agrega dos hechizos de Mago de tu elección a tu libro de hechizos. Cada uno de estos hechizos debe ser de un nivel para el cual tengas espacios para hechizos, como se muestra en la tabla de Funciones del asistente. Los hechizos son la culminación de una investigación arcana que realizas con regularidad.\n\nRanuras para hechizos. La tabla de Funciones del asistente muestra cuántos espacios para hechizos tienes para lanzar tus hechizos de nivel 1+. Recuperas todos los espacios gastados cuando terminas un descanso prolongado.\n\nHechizos preparados de nivel 1+. Usted prepara la lista de hechizos de nivel 1+ que están disponibles para lanzar con esta función. Para hacerlo, elige cuatro hechizos de tu libro de hechizos. Los hechizos elegidos deben ser de un nivel para el que tengas espacios para hechizos.\n\nLa cantidad de hechizos en tu lista aumenta a medida que obtienes niveles de mago, como se muestra en la columna Hechizos preparados de la tabla Funciones del mago. Siempre que ese número aumente, elige hechizos de mago adicionales hasta que el número de hechizos de tu lista coincida con el número de la tabla. Los hechizos elegidos deben ser de un nivel para el que tengas espacios para hechizos. Por ejemplo, si eres un mago de nivel 3, tu lista de hechizos preparados puede incluir seis hechizos de niveles 1 y 2 en cualquier combinación, elegidos de tu libro de hechizos.\n\nSi otra característica de Mago te proporciona hechizos que siempre has preparado, esos hechizos no cuentan para la cantidad de hechizos que puedes preparar con esta característica, pero esos hechizos cuentan como hechizos de Mago para ti.\n\nCambiando tus hechizos preparados. Siempre que termines un Descanso Largo, puedes cambiar tu lista de hechizos preparados, reemplazando cualquiera de los hechizos allí con hechizos de tu libro de hechizos.\n\nHabilidad de lanzar hechizos. La inteligencia es tu habilidad para lanzar hechizos para tus hechizos de mago.\n\nEnfoque de lanzamiento de hechizos. Puedes usar un foco arcano o tu libro de hechizos como foco de lanzamiento de hechizos para tus hechizos de mago.\n\nAmpliar y reemplazar un libro de hechizos\n\nLos hechizos que agregas a tu libro de hechizos a medida que subes de nivel reflejan tu investigación mágica en curso, pero es posible que encuentres otros hechizos durante tus aventuras que puedas agregar al libro. Podrías descubrir un hechizo de mago en un Pergamino de hechizos, por ejemplo, y luego copiarlo en tu libro de hechizos.\n\nCopiar un hechizo en el libro. Cuando encuentres un hechizo de mago de nivel 1+, puedes copiarlo en tu libro de hechizos si es de un nivel que puedes preparar y si tienes tiempo para copiarlo. Para cada nivel del hechizo, la transcripción tarda 2 horas y cuesta 50 GP. Luego puedes preparar el hechizo como los demás hechizos de tu libro de hechizos.\n\nCopiando el libro. Puedes copiar un hechizo de tu libro de hechizos a otro libro. Esto es como copiar un nuevo hechizo en tu libro de hechizos, pero más rápido, ya que ya sabes cómo lanzarlo. Necesitas gastar sólo 1 hora y 10 GP por cada nivel del hechizo copiado.\n\nSi pierdes tu libro de hechizos, puedes utilizar el mismo procedimiento para transcribir los hechizos de mago que has preparado en un nuevo libro de hechizos. Completar el resto del nuevo libro requiere que encuentres nuevos hechizos para hacerlo. Por esta razón, muchos magos mantienen un libro de hechizos de respaldo."
      },
      {
        id: "wizard:lvl1:ritual-adept:2",
        name: "Adepto ritual",
        class: "wizard",
        level: 1,
        description: "Puedes lanzar cualquier hechizo como Ritual si ese hechizo tiene la etiqueta Ritual y el hechizo está en tu libro de hechizos. No necesitas tener el hechizo preparado, pero debes leer el libro para lanzar un hechizo de esta manera."
      },
      {
        id: "wizard:lvl1:arcane-recovery:3",
        name: "Recuperación Arcana",
        class: "wizard",
        level: 1,
        description: "Puedes recuperar algo de tu energía mágica estudiando tu libro de hechizos. Cuando terminas un breve descanso, puedes elegir espacios de hechizo gastados para recuperarte. Los espacios para hechizos pueden tener un nivel combinado igual a no más de la mitad de tu nivel de Mago (redondeando hacia arriba), y ninguno de los espacios puede ser de nivel 6 o superior. Por ejemplo, si eres un mago de nivel 4, puedes recuperar hasta dos niveles de espacios para hechizos, recuperando un espacio para hechizos de nivel 2 o dos espacios para hechizos de nivel 1.\n\nUna vez que uses esta función, no podrás volver a hacerlo hasta que termines un descanso prolongado."
      },
      {
        id: "wizard:lvl2:scholar:1",
        name: "Erudito",
        class: "wizard",
        level: 2,
        description: "Mientras estudiabas magia, también te especializaste en otro campo de estudio. Elija una de las siguientes habilidades en las que tenga competencia: Arcanos, Historia, Investigación, Medicina, Naturaleza o Religión. Tienes experiencia en la habilidad elegida."
      },
      {
        id: "wizard:lvl3:wizard-subclass:1",
        name: "Subclase de mago",
        class: "wizard",
        level: 3,
        description: "Obtienes una subclase de mago de tu elección. La subclase Evoker se detalla después de la descripción de esta clase. Una subclase es una especialización que te otorga funciones en ciertos niveles de asistente. Durante el resto de tu carrera, obtienes cada una de las características de tu subclase que sean de tu nivel de Mago o inferior."
      },
      {
        id: "wizard:lvl4:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "wizard",
        level: 4,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de Asistente 8, 12 y 16."
      },
      {
        id: "wizard:lvl5:memorize-spell:1",
        name: "Memorizar hechizo",
        class: "wizard",
        level: 5,
        description: "Siempre que termines un breve descanso, puedes estudiar tu libro de hechizos y reemplazar uno de los hechizos de mago de nivel 1+ que has preparado para tu función de lanzamiento de hechizos con otro hechizo de nivel 1+ del libro."
      },
      {
        id: "wizard:lvl6:subclass-feature:1",
        name: "Característica de subclase",
        class: "wizard",
        level: 6
      },
      {
        id: "wizard:lvl7:feature:1",
        name: "—",
        class: "wizard",
        level: 7
      },
      {
        id: "wizard:lvl8:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "wizard",
        level: 8,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de Asistente 8, 12 y 16."
      },
      {
        id: "wizard:lvl9:feature:1",
        name: "—",
        class: "wizard",
        level: 9
      },
      {
        id: "wizard:lvl10:subclass-feature:1",
        name: "Característica de subclase",
        class: "wizard",
        level: 10
      },
      {
        id: "wizard:lvl11:feature:1",
        name: "—",
        class: "wizard",
        level: 11
      },
      {
        id: "wizard:lvl12:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "wizard",
        level: 12,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de Asistente 8, 12 y 16."
      },
      {
        id: "wizard:lvl13:feature:1",
        name: "—",
        class: "wizard",
        level: 13
      },
      {
        id: "wizard:lvl14:subclass-feature:1",
        name: "Característica de subclase",
        class: "wizard",
        level: 14
      },
      {
        id: "wizard:lvl15:feature:1",
        name: "—",
        class: "wizard",
        level: 15
      },
      {
        id: "wizard:lvl16:ability-score-improvement:1",
        name: "Mejora de la puntuación de habilidad",
        class: "wizard",
        level: 16,
        description: "Obtienes la dote de mejora de puntuación de habilidad (ver “Dotes”) u otra dote de tu elección para la cual calificas. Obtienes esta característica nuevamente en los niveles de Asistente 8, 12 y 16."
      },
      {
        id: "wizard:lvl17:feature:1",
        name: "—",
        class: "wizard",
        level: 17
      },
      {
        id: "wizard:lvl18:spell-mastery:1",
        name: "Dominio de hechizos",
        class: "wizard",
        level: 18,
        description: "Has logrado tal dominio sobre ciertos hechizos que puedes lanzarlos a voluntad. Elige un hechizo de nivel 1 y uno de nivel 2 en tu libro de hechizos que tengan un tiempo de lanzamiento de una acción. Siempre tienes esos hechizos preparados y puedes lanzarlos en su nivel más bajo sin gastar un espacio de hechizo. Para lanzar cualquiera de los hechizos a un nivel superior, debes gastar un espacio de hechizo.\n\nSiempre que termines un Descanso Largo, puedes estudiar tu libro de hechizos y reemplazar uno de esos hechizos con un hechizo elegible del mismo nivel del libro."
      },
      {
        id: "wizard:lvl19:epic-boon:1",
        name: "Bendición épica",
        class: "wizard",
        level: 19,
        description: "Obtienes una dote de bendición épica (ver “Dotes”) u otra dote de tu elección para la cual calificas. Se recomienda la bendición de recordar hechizos."
      },
      {
        id: "wizard:lvl20:signature-spells:1",
        name: "Hechizos característicos",
        class: "wizard",
        level: 20,
        description: "Elige dos hechizos de nivel 3 en tu libro de hechizos como tus hechizos característicos. Siempre tienes estos hechizos preparados y puedes lanzar cada uno de ellos una vez en el nivel 3 sin gastar un espacio de hechizo. Cuando lo hagas, no podrás volver a lanzarlos de esta manera hasta que termines un Descanso Corto o Largo. Para lanzar cualquiera de los hechizos a un nivel superior, debes gastar un espacio de hechizo."
      }
    ],
    subclasses: [
      {
        id: "wizard:evoker",
        name: "evocador",
        classId: "wizard",
        unlockLevel: 3,
        source: "Reglas gratuitas de D&D 2024",
        features: [
          {
            id: "wizard:evoker:lvl3:evocation-savant",
            name: "Sabio de la evocación",
            class: "wizard",
            level: 3,
            subclassId: "wizard:evoker",
            subclassName: "evocador",
            description: "Elige dos hechizos de Mago de la escuela de Evocación, cada uno de los cuales no debe ser superior al nivel 2, y agrégalos a tu libro de hechizos de forma gratuita.\n\nAdemás, cada vez que obtengas acceso a un nuevo nivel de espacios para hechizos en esta clase, podrás agregar un hechizo de Mago de la escuela de Evocación a tu libro de hechizos de forma gratuita. El hechizo elegido debe ser de un nivel para el que tengas espacios para hechizos."
          },
          {
            id: "wizard:evoker:lvl3:potent-cantrip",
            name: "Potente truco",
            class: "wizard",
            level: 3,
            subclassId: "wizard:evoker",
            subclassName: "evocador",
            description: "Tus trucos dañinos afectan incluso a las criaturas que evitan la peor parte del efecto. Cuando lanzas un truco a una criatura y fallas con la tirada de ataque o el objetivo tiene éxito en una tirada de salvación contra el truco, el objetivo recibe la mitad del daño del truco (si corresponde) pero no sufre ningún efecto adicional del truco."
          },
          {
            id: "wizard:evoker:lvl6:sculpt-spells",
            name: "Esculpir hechizos",
            class: "wizard",
            level: 6,
            subclassId: "wizard:evoker",
            subclassName: "evocador",
            description: "Puedes crear focos de relativa seguridad dentro de los efectos de tus evocaciones. Cuando lanzas un hechizo de Evocación que afecta a otras criaturas que puedes ver, puedes elegir un número de ellas igual a 1 más el nivel del hechizo. Las criaturas elegidas automáticamente tienen éxito en sus tiradas de salvación contra el hechizo, y no reciben daño si normalmente recibirían la mitad del daño en una salvación exitosa."
          },
          {
            id: "wizard:evoker:lvl10:empowered-evocation",
            name: "Evocación potenciada",
            class: "wizard",
            level: 10,
            subclassId: "wizard:evoker",
            subclassName: "evocador",
            description: "Siempre que lances un hechizo de Mago de la escuela de Evocación, puedes agregar tu modificador de Inteligencia a una tirada de daño de ese hechizo."
          },
          {
            id: "wizard:evoker:lvl14:overchannel",
            name: "sobrecanal",
            class: "wizard",
            level: 14,
            subclassId: "wizard:evoker",
            subclassName: "evocador",
            description: "Puedes aumentar el poder de tus hechizos. Cuando lanzas un hechizo de Mago con un espacio de hechizo de niveles 1 a 5 que causa daño, puedes causar el máximo daño con ese hechizo en el turno en que lo lanzas.\n\nLa primera vez que lo haces no sufres ningún efecto adverso. Si usas esta característica nuevamente antes de terminar un Descanso Largo, recibirás 2d12 de daño necrótico por cada nivel del espacio del hechizo inmediatamente después de lanzarlo. Este daño ignora la Resistencia y la Inmunidad.\n\nCada vez que vuelves a utilizar esta función antes de finalizar un descanso prolongado, el daño necrótico por nivel de hechizo aumenta en 1d12.\n\n//"
          }
        ]
      }
    ]
  },
  artificer: {
    classId: "artificer",
    className: "Artificiero",
    source: "Integracion Artificiero 5e",
    subclassUnlockLevel: 3,
    classFeatures: [
      {
        id: "artificer:lvl1:magical-tinkering",
        name: "Retoques magicos",
        class: "artificer",
        level: 1,
        description:
          "Puedes tocar un objeto diminuto no magico y darle un efecto magico menor (luz, mensaje grabado, olor/sonido o una imagen estatica). Puedes mantener varios efectos activos y renovarlos tras descansar."
      },
      {
        id: "artificer:lvl1:spellcasting",
        name: "Lanzamiento de conjuros",
        class: "artificer",
        level: 1,
        description:
          "Lanzas conjuros usando Inteligencia como caracteristica de lanzamiento. El artificiero prepara conjuros de su lista y puede usar herramientas como foco."
      },
      {
        id: "artificer:lvl2:infuse-item",
        name: "Infundir objeto",
        class: "artificer",
        level: 2,
        description:
          "Aprendes infusiones y puedes convertir objetos no magicos en objetos magicos al final de un descanso largo. El numero de infusiones activas depende de tu nivel."
      },
      {
        id: "artificer:lvl3:right-tool-for-the-job",
        name: "La herramienta adecuada",
        class: "artificer",
        level: 3,
        description:
          "Con herramientas de ladron puedes crear un juego de herramientas de artesano en una hora si tienes metal suficiente."
      },
      {
        id: "artificer:lvl3:artificer-specialist",
        name: "Especialista artificiero",
        class: "artificer",
        level: 3,
        description:
          "Eliges una especialidad: Alquimista, Armero, Artillero o Herrero de Batalla. Ganas rasgos de subclase en niveles 3, 5, 9 y 15."
      },
      {
        id: "artificer:lvl4:asi",
        name: "Mejora de puntuacion de caracteristica",
        class: "artificer",
        level: 4,
        description:
          "Aumenta una puntuacion de caracteristica en 2, o dos puntuaciones en 1, o elige una dote si se usan dotes."
      },
      {
        id: "artificer:lvl5:specialist-feature",
        name: "Rasgo de especialista",
        class: "artificer",
        level: 5,
        description: "Ganas el rasgo de nivel 5 de tu especialidad."
      },
      {
        id: "artificer:lvl6:tool-expertise",
        name: "Pericia con herramientas",
        class: "artificer",
        level: 6,
        description:
          "Tu bonificador por competencia se duplica en pruebas de caracteristica con herramientas en las que seas competente."
      },
      {
        id: "artificer:lvl7:flash-of-genius",
        name: "Destello de genialidad",
        class: "artificer",
        level: 7,
        description:
          "Cuando tu o una criatura a 30 pies haga una prueba o salvacion, puedes usar tu reaccion para sumar tu modificador de Inteligencia. Usos por descanso largo: minimo 1."
      },
      {
        id: "artificer:lvl8:asi",
        name: "Mejora de puntuacion de caracteristica",
        class: "artificer",
        level: 8,
        description:
          "Aumenta una puntuacion de caracteristica en 2, o dos puntuaciones en 1, o elige una dote si se usan dotes."
      },
      {
        id: "artificer:lvl9:specialist-feature",
        name: "Rasgo de especialista",
        class: "artificer",
        level: 9,
        description: "Ganas el rasgo de nivel 9 de tu especialidad."
      },
      {
        id: "artificer:lvl10:magic-item-adept",
        name: "Adepto de objetos magicos",
        class: "artificer",
        level: 10,
        description:
          "Puedes vincularte a 4 objetos magicos y fabricar objetos comunes o poco comunes mas rapido y barato."
      },
      {
        id: "artificer:lvl11:spell-storing-item",
        name: "Objeto almacenador de conjuros",
        class: "artificer",
        level: 11,
        description:
          "Guardas un conjuro de nivel 1 o 2 del artificiero en un objeto para que se pueda lanzar varias veces."
      },
      {
        id: "artificer:lvl12:asi",
        name: "Mejora de puntuacion de caracteristica",
        class: "artificer",
        level: 12,
        description:
          "Aumenta una puntuacion de caracteristica en 2, o dos puntuaciones en 1, o elige una dote si se usan dotes."
      },
      {
        id: "artificer:lvl14:magic-item-savant",
        name: "Experto en objetos magicos",
        class: "artificer",
        level: 14,
        description:
          "Puedes vincularte a 5 objetos magicos e ignorar requisitos de clase, raza, conjuro o nivel para vincularte."
      },
      {
        id: "artificer:lvl15:specialist-feature",
        name: "Rasgo de especialista",
        class: "artificer",
        level: 15,
        description: "Ganas el rasgo de nivel 15 de tu especialidad."
      },
      {
        id: "artificer:lvl16:asi",
        name: "Mejora de puntuacion de caracteristica",
        class: "artificer",
        level: 16,
        description:
          "Aumenta una puntuacion de caracteristica en 2, o dos puntuaciones en 1, o elige una dote si se usan dotes."
      },
      {
        id: "artificer:lvl18:magic-item-master",
        name: "Maestro de objetos magicos",
        class: "artificer",
        level: 18,
        description: "Puedes vincularte a 6 objetos magicos a la vez."
      },
      {
        id: "artificer:lvl19:asi",
        name: "Mejora de puntuacion de caracteristica",
        class: "artificer",
        level: 19,
        description:
          "Aumenta una puntuacion de caracteristica en 2, o dos puntuaciones en 1, o elige una dote si se usan dotes."
      },
      {
        id: "artificer:lvl20:soul-of-artifice",
        name: "Alma de artificio",
        class: "artificer",
        level: 20,
        description:
          "Ganas +1 a todas las salvaciones por cada objeto magico al que estes vinculado, y puedes terminar una infusion para no caer a 0 puntos de golpe."
      }
    ],
    subclasses: [
      {
        id: "artificer:alchemist",
        name: "Alquimista",
        classId: "artificer",
        unlockLevel: 3,
        source: "Integracion Artificiero 5e",
        features: [
          {
            id: "artificer:alchemist:lvl3:tool-proficiency",
            name: "Competencia con herramientas",
            class: "artificer",
            level: 3,
            subclassId: "artificer:alchemist",
            subclassName: "Alquimista",
            description: "Ganas competencia con suministros de alquimista."
          },
          {
            id: "artificer:alchemist:lvl3:alchemist-spells",
            name: "Conjuros de alquimista",
            class: "artificer",
            level: 3,
            subclassId: "artificer:alchemist",
            subclassName: "Alquimista",
            description:
              "Siempre tienes preparados conjuros extra de Alquimista en niveles de especialidad."
          },
          {
            id: "artificer:alchemist:lvl3:experimental-elixir",
            name: "Elixir experimental",
            class: "artificer",
            level: 3,
            subclassId: "artificer:alchemist",
            subclassName: "Alquimista",
            description:
              "Al terminar un descanso largo creas un elixir aleatorio; tambien puedes gastar espacios para crear elixires concretos."
          },
          {
            id: "artificer:alchemist:lvl5:alchemical-savant",
            name: "Erudito alquimico",
            class: "artificer",
            level: 5,
            subclassId: "artificer:alchemist",
            subclassName: "Alquimista",
            description:
              "Cuando lanzas conjuros usando suministros de alquimista como foco, anades tu modificador de Inteligencia a una tirada de curacion o dano elegible."
          },
          {
            id: "artificer:alchemist:lvl9:restorative-reagents",
            name: "Reactivos restauradores",
            class: "artificer",
            level: 9,
            subclassId: "artificer:alchemist",
            subclassName: "Alquimista",
            description:
              "Tus elixires otorgan puntos de golpe temporales, y puedes lanzar Lesser Restoration sin gastar espacio un numero limitado de veces."
          },
          {
            id: "artificer:alchemist:lvl15:chemical-mastery",
            name: "Maestria quimica",
            class: "artificer",
            level: 15,
            subclassId: "artificer:alchemist",
            subclassName: "Alquimista",
            description:
              "Obtienes resistencia al acido y veneno, inmunidad al estado envenenado, y acceso limitado a Greater Restoration y Heal."
          }
        ]
      },
      {
        id: "artificer:armorer",
        name: "Armero",
        classId: "artificer",
        unlockLevel: 3,
        source: "Integracion Artificiero 5e",
        features: [
          {
            id: "artificer:armorer:lvl3:tools-of-the-trade",
            name: "Herramientas del oficio",
            class: "artificer",
            level: 3,
            subclassId: "artificer:armorer",
            subclassName: "Armero",
            description: "Ganas competencia con armadura pesada y herramientas de herrero."
          },
          {
            id: "artificer:armorer:lvl3:armorer-spells",
            name: "Conjuros de armero",
            class: "artificer",
            level: 3,
            subclassId: "artificer:armorer",
            subclassName: "Armero",
            description: "Siempre tienes preparados conjuros extra de Armero."
          },
          {
            id: "artificer:armorer:lvl3:arcane-armor",
            name: "Armadura arcana",
            class: "artificer",
            level: 3,
            subclassId: "artificer:armorer",
            subclassName: "Armero",
            description:
              "Tu armadura se convierte en foco arcano, puede colocarse y retirarse mejor, reemplaza miembros perdidos y no puede quitarse contra tu voluntad."
          },
          {
            id: "artificer:armorer:lvl3:armor-model",
            name: "Modelo de armadura",
            class: "artificer",
            level: 3,
            subclassId: "artificer:armorer",
            subclassName: "Armero",
            description:
              "Eliges Guardian o Infiltrador; cada modelo otorga armas integradas y beneficios de combate distintos."
          },
          {
            id: "artificer:armorer:lvl5:extra-attack",
            name: "Ataque adicional",
            class: "artificer",
            level: 5,
            subclassId: "artificer:armorer",
            subclassName: "Armero",
            description: "Puedes atacar dos veces cuando realizas la accion de Ataque."
          },
          {
            id: "artificer:armorer:lvl9:armor-modifications",
            name: "Modificaciones de armadura",
            class: "artificer",
            level: 9,
            subclassId: "artificer:armorer",
            subclassName: "Armero",
            description:
              "Tu armadura arcana cuenta como varias piezas para aplicar infusiones adicionales."
          },
          {
            id: "artificer:armorer:lvl15:perfected-armor",
            name: "Armadura perfeccionada",
            class: "artificer",
            level: 15,
            subclassId: "artificer:armorer",
            subclassName: "Armero",
            description:
              "Tus modelos Guardian e Infiltrador mejoran con efectos de control y movilidad mas potentes."
          }
        ]
      },
      {
        id: "artificer:artillerist",
        name: "Artillero",
        classId: "artificer",
        unlockLevel: 3,
        source: "Integracion Artificiero 5e",
        features: [
          {
            id: "artificer:artillerist:lvl3:tool-proficiency",
            name: "Competencia con herramientas",
            class: "artificer",
            level: 3,
            subclassId: "artificer:artillerist",
            subclassName: "Artillero",
            description: "Ganas competencia con herramientas de tallista de madera."
          },
          {
            id: "artificer:artillerist:lvl3:artillerist-spells",
            name: "Conjuros de artillero",
            class: "artificer",
            level: 3,
            subclassId: "artificer:artillerist",
            subclassName: "Artillero",
            description: "Siempre tienes preparados conjuros extra de Artillero."
          },
          {
            id: "artificer:artillerist:lvl3:eldritch-cannon",
            name: "Canon eldritch",
            class: "artificer",
            level: 3,
            subclassId: "artificer:artillerist",
            subclassName: "Artillero",
            description:
              "Creas un canon magico (Lanzallamas, Ballesta de Fuerza o Protector) que puedes ordenar con accion adicional."
          },
          {
            id: "artificer:artillerist:lvl5:arcane-firearm",
            name: "Arma de fuego arcana",
            class: "artificer",
            level: 5,
            subclassId: "artificer:artillerist",
            subclassName: "Artillero",
            description:
              "Conviertes una vara, baston o varita en arma de fuego arcana y anades dano extra a una tirada de dano de conjuro de artificiero."
          },
          {
            id: "artificer:artillerist:lvl9:explosive-cannon",
            name: "Canon explosivo",
            class: "artificer",
            level: 9,
            subclassId: "artificer:artillerist",
            subclassName: "Artillero",
            description:
              "Tus canones hacen mas dano y puedes detonarlos para crear una explosion en area."
          },
          {
            id: "artificer:artillerist:lvl15:fortified-position",
            name: "Posicion fortificada",
            class: "artificer",
            level: 15,
            subclassId: "artificer:artillerist",
            subclassName: "Artillero",
            description:
              "Tu y tus aliados cercanos al canon obteneis mejor proteccion y puedes controlar dos canones a la vez."
          }
        ]
      },
      {
        id: "artificer:battle-smith",
        name: "Herrero de Batalla",
        classId: "artificer",
        unlockLevel: 3,
        source: "Integracion Artificiero 5e",
        features: [
          {
            id: "artificer:battle-smith:lvl3:tool-proficiency",
            name: "Competencia con herramientas",
            class: "artificer",
            level: 3,
            subclassId: "artificer:battle-smith",
            subclassName: "Herrero de Batalla",
            description: "Ganas competencia con herramientas de herrero."
          },
          {
            id: "artificer:battle-smith:lvl3:battle-smith-spells",
            name: "Conjuros de herrero de batalla",
            class: "artificer",
            level: 3,
            subclassId: "artificer:battle-smith",
            subclassName: "Herrero de Batalla",
            description: "Siempre tienes preparados conjuros extra de Herrero de Batalla."
          },
          {
            id: "artificer:battle-smith:lvl3:battle-ready",
            name: "Listo para la batalla",
            class: "artificer",
            level: 3,
            subclassId: "artificer:battle-smith",
            subclassName: "Herrero de Batalla",
            description:
              "Ganas competencia con armas marciales y puedes usar Inteligencia para ataque y dano con armas magicas."
          },
          {
            id: "artificer:battle-smith:lvl3:steel-defender",
            name: "Defensor de acero",
            class: "artificer",
            level: 3,
            subclassId: "artificer:battle-smith",
            subclassName: "Herrero de Batalla",
            description:
              "Construyes un Defensor de Acero que actua en combate y puede proteger aliados con su reaccion."
          },
          {
            id: "artificer:battle-smith:lvl5:extra-attack",
            name: "Ataque adicional",
            class: "artificer",
            level: 5,
            subclassId: "artificer:battle-smith",
            subclassName: "Herrero de Batalla",
            description: "Puedes atacar dos veces cuando realizas la accion de Ataque."
          },
          {
            id: "artificer:battle-smith:lvl9:arcane-jolt",
            name: "Descarga arcana",
            class: "artificer",
            level: 9,
            subclassId: "artificer:battle-smith",
            subclassName: "Herrero de Batalla",
            description:
              "Cuando tu o tu Defensor de Acero impactais, puedes hacer dano de fuerza extra o curar a una criatura cercana."
          },
          {
            id: "artificer:battle-smith:lvl15:improved-defender",
            name: "Defensor mejorado",
            class: "artificer",
            level: 15,
            subclassId: "artificer:battle-smith",
            subclassName: "Herrero de Batalla",
            description:
              "Tu Defensor de Acero mejora dano, resistencia y reaccion Deflect Attack."
          }
        ]
      }
    ]
  }
};
