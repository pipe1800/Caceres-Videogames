
export interface Municipality {
  id: string;
  name: string;
}

export interface Department {
  id: string;
  name: string;
  municipalities: Municipality[];
}

export const elSalvadorDepartments: Department[] = [
  {
    id: 'ahuachapan',
    name: 'Ahuachapán',
    municipalities: [
      { id: 'ahuachapan', name: 'Ahuachapán' },
      { id: 'apaneca', name: 'Apaneca' },
      { id: 'atiquizaya', name: 'Atiquizaya' },
      { id: 'concepcion-de-ataco', name: 'Concepción de Ataco' },
      { id: 'el-refugio', name: 'El Refugio' },
      { id: 'guaymango', name: 'Guaymango' },
      { id: 'jujutla', name: 'Jujutla' },
      { id: 'san-francisco-menendez', name: 'San Francisco Menéndez' },
      { id: 'san-lorenzo', name: 'San Lorenzo' },
      { id: 'san-pedro-puxtla', name: 'San Pedro Puxtla' },
      { id: 'tacuba', name: 'Tacuba' },
      { id: 'turin', name: 'Turín' }
    ]
  },
  {
    id: 'santa-ana',
    name: 'Santa Ana',
    municipalities: [
      { id: 'santa-ana', name: 'Santa Ana' },
      { id: 'candelaria-de-la-frontera', name: 'Candelaria de la Frontera' },
      { id: 'chalchuapa', name: 'Chalchuapa' },
      { id: 'coatepeque', name: 'Coatepeque' },
      { id: 'el-congo', name: 'El Congo' },
      { id: 'el-porvenir', name: 'El Porvenir' },
      { id: 'masahuat', name: 'Masahuat' },
      { id: 'metapan', name: 'Metapán' },
      { id: 'san-antonio-pajonal', name: 'San Antonio Pajonal' },
      { id: 'san-sebastian-salitrillo', name: 'San Sebastián Salitrillo' },
      { id: 'santa-rosa-guachipilin', name: 'Santa Rosa Guachipilín' },
      { id: 'santiago-de-la-frontera', name: 'Santiago de la Frontera' },
      { id: 'texistepeque', name: 'Texistepeque' }
    ]
  },
  {
    id: 'sonsonate',
    name: 'Sonsonate',
    municipalities: [
      { id: 'sonsonate', name: 'Sonsonate' },
      { id: 'acajutla', name: 'Acajutla' },
      { id: 'armenia', name: 'Armenia' },
      { id: 'caluco', name: 'Caluco' },
      { id: 'cuisnahuat', name: 'Cuisnahuat' },
      { id: 'izalco', name: 'Izalco' },
      { id: 'juayua', name: 'Juayúa' },
      { id: 'nahuizalco', name: 'Nahuizalco' },
      { id: 'nahulingo', name: 'Nahulingo' },
      { id: 'salcoatitan', name: 'Salcoatitán' },
      { id: 'san-antonio-del-monte', name: 'San Antonio del Monte' },
      { id: 'san-julian', name: 'San Julián' },
      { id: 'santa-catarina-masahuat', name: 'Santa Catarina Masahuat' },
      { id: 'santa-isabel-ishuatan', name: 'Santa Isabel Ishuatán' },
      { id: 'santo-domingo-de-guzman', name: 'Santo Domingo de Guzmán' },
      { id: 'sonzacate', name: 'Sonzacate' }
    ]
  },
  {
    id: 'la-libertad',
    name: 'La Libertad',
    municipalities: [
      { id: 'santa-tecla', name: 'Santa Tecla' },
      { id: 'antiguo-cuscatlan', name: 'Antiguo Cuscatlán' },
      { id: 'ciudad-arce', name: 'Ciudad Arce' },
      { id: 'colon', name: 'Colón' },
      { id: 'comasagua', name: 'Comasagua' },
      { id: 'huizucar', name: 'Huizúcar' },
      { id: 'jayaque', name: 'Jayaque' },
      { id: 'jicalapa', name: 'Jicalapa' },
      { id: 'la-libertad', name: 'La Libertad' },
      { id: 'nuevo-cuscatlan', name: 'Nuevo Cuscatlán' },
      { id: 'san-juan-opico', name: 'San Juan Opico' },
      { id: 'quezaltepeque', name: 'Quezaltepeque' },
      { id: 'sacacoyo', name: 'Sacacoyo' },
      { id: 'san-jose-villanueva', name: 'San José Villanueva' },
      { id: 'san-matias', name: 'San Matías' },
      { id: 'san-pablo-tacachico', name: 'San Pablo Tacachico' },
      { id: 'talnique', name: 'Talnique' },
      { id: 'tamanique', name: 'Tamanique' },
      { id: 'teotepeque', name: 'Teotepeque' },
      { id: 'tepecoyo', name: 'Tepecoyo' },
      { id: 'zaragoza', name: 'Zaragoza' }
    ]
  },
  {
    id: 'san-salvador',
    name: 'San Salvador',
    municipalities: [
      { id: 'san-salvador', name: 'San Salvador' },
      { id: 'aguilares', name: 'Aguilares' },
      { id: 'apopa', name: 'Apopa' },
      { id: 'ayutuxtepeque', name: 'Ayutuxtepeque' },
      { id: 'cuscatancingo', name: 'Cuscatancingo' },
      { id: 'delgado', name: 'Ciudad Delgado' },
      { id: 'el-paisnal', name: 'El Paisnal' },
      { id: 'guazapa', name: 'Guazapa' },
      { id: 'ilopango', name: 'Ilopango' },
      { id: 'mejicanos', name: 'Mejicanos' },
      { id: 'nejapa', name: 'Nejapa' },
      { id: 'panchimalco', name: 'Panchimalco' },
      { id: 'rosario-de-mora', name: 'Rosario de Mora' },
      { id: 'san-marcos', name: 'San Marcos' },
      { id: 'san-martin', name: 'San Martín' },
      { id: 'santiago-texacuangos', name: 'Santiago Texacuangos' },
      { id: 'santo-tomas', name: 'Santo Tomás' },
      { id: 'soyapango', name: 'Soyapango' },
      { id: 'tonacatepeque', name: 'Tonacatepeque' }
    ]
  },
  {
    id: 'chalatenango',
    name: 'Chalatenango',
    municipalities: [
      { id: 'chalatenango', name: 'Chalatenango' },
      { id: 'agua-caliente', name: 'Agua Caliente' },
      { id: 'arcatao', name: 'Arcatao' },
      { id: 'azacualpa', name: 'Azacualpa' },
      { id: 'cancasque', name: 'Cancasque' },
      { id: 'citalá', name: 'Citalá' },
      { id: 'comalapa', name: 'Comalapa' },
      { id: 'concepcion-quezaltepeque', name: 'Concepción Quezaltepeque' },
      { id: 'dulce-nombre-de-maria', name: 'Dulce Nombre de María' },
      { id: 'el-carrizal', name: 'El Carrizal' },
      { id: 'el-paraiso', name: 'El Paraíso' },
      { id: 'la-laguna', name: 'La Laguna' },
      { id: 'la-palma', name: 'La Palma' },
      { id: 'la-reina', name: 'La Reina' },
      { id: 'las-vueltas', name: 'Las Vueltas' },
      { id: 'nombre-de-jesus', name: 'Nombre de Jesús' },
      { id: 'nueva-concepcion', name: 'Nueva Concepción' },
      { id: 'nueva-trinidad', name: 'Nueva Trinidad' },
      { id: 'ojos-de-agua', name: 'Ojos de Agua' },
      { id: 'potonico', name: 'Potonico' },
      { id: 'san-antonio-de-la-cruz', name: 'San Antonio de la Cruz' },
      { id: 'san-antonio-los-ranchos', name: 'San Antonio Los Ranchos' },
      { id: 'san-fernando', name: 'San Fernando' },
      { id: 'san-francisco-lempa', name: 'San Francisco Lempa' },
      { id: 'san-francisco-morazan', name: 'San Francisco Morazán' },
      { id: 'san-ignacio', name: 'San Ignacio' },
      { id: 'san-isidro-labrador', name: 'San Isidro Labrador' },
      { id: 'san-jose-cancasque', name: 'San José Cancasque' },
      { id: 'san-jose-las-flores', name: 'San José Las Flores' },
      { id: 'san-luis-del-carmen', name: 'San Luis del Carmen' },
      { id: 'san-miguel-de-mercedes', name: 'San Miguel de Mercedes' },
      { id: 'san-rafael', name: 'San Rafael' },
      { id: 'santa-rita', name: 'Santa Rita' },
      { id: 'tejutla', name: 'Tejutla' }
    ]
  },
  {
    id: 'cuscatlan',
    name: 'Cuscatlán',
    municipalities: [
      { id: 'cojutepeque', name: 'Cojutepeque' },
      { id: 'candelaria', name: 'Candelaria' },
      { id: 'el-carmen', name: 'El Carmen' },
      { id: 'el-rosario', name: 'El Rosario' },
      { id: 'monte-san-juan', name: 'Monte San Juan' },
      { id: 'oratorio-de-concepcion', name: 'Oratorio de Concepción' },
      { id: 'san-bartolome-perulapi', name: 'San Bartolomé Perulapía' },
      { id: 'san-cristobal', name: 'San Cristóbal' },
      { id: 'san-jose-guayabal', name: 'San José Guayabal' },
      { id: 'san-pedro-perulapi', name: 'San Pedro Perulapán' },
      { id: 'san-rafael-cedros', name: 'San Rafael Cedros' },
      { id: 'san-ramon', name: 'San Ramón' },
      { id: 'santa-cruz-analquito', name: 'Santa Cruz Analquito' },
      { id: 'santa-cruz-michapa', name: 'Santa Cruz Michapa' },
      { id: 'suchitoto', name: 'Suchitoto' },
      { id: 'tenancingo', name: 'Tenancingo' }
    ]
  },
  {
    id: 'la-paz',
    name: 'La Paz',
    municipalities: [
      { id: 'zacatecoluca', name: 'Zacatecoluca' },
      { id: 'cuyultitan', name: 'Cuyultitán' },
      { id: 'el-rosario-la-paz', name: 'El Rosario' },
      { id: 'jerusalen', name: 'Jerusalén' },
      { id: 'mercedes-la-ceiba', name: 'Mercedes La Ceiba' },
      { id: 'olocuilta', name: 'Olocuilta' },
      { id: 'paraiso-de-osorio', name: 'Paraíso de Osorio' },
      { id: 'san-antonio-masahuat', name: 'San Antonio Masahuat' },
      { id: 'san-emigdio', name: 'San Emigdio' },
      { id: 'san-francisco-chinameca', name: 'San Francisco Chinameca' },
      { id: 'san-juan-nonualco', name: 'San Juan Nonualco' },
      { id: 'san-juan-talpa', name: 'San Juan Talpa' },
      { id: 'san-juan-tepezontes', name: 'San Juan Tepezontes' },
      { id: 'san-luis-la-herradura', name: 'San Luis La Herradura' },
      { id: 'san-luis-talpa', name: 'San Luis Talpa' },
      { id: 'san-miguel-tepezontes', name: 'San Miguel Tepezontes' },
      { id: 'san-pedro-masahuat', name: 'San Pedro Masahuat' },
      { id: 'san-pedro-nonualco', name: 'San Pedro Nonualco' },
      { id: 'san-rafael-obrajuelo', name: 'San Rafael Obrajuelo' },
      { id: 'santa-maria-ostuma', name: 'Santa María Ostuma' },
      { id: 'santiago-nonualco', name: 'Santiago Nonualco' },
      { id: 'tapalhuaca', name: 'Tapalhuaca' }
    ]
  },
  {
    id: 'cabanas',
    name: 'Cabañas',
    municipalities: [
      { id: 'sensuntepeque', name: 'Sensuntepeque' },
      { id: 'cinquera', name: 'Cinquera' },
      { id: 'dolores', name: 'Dolores' },
      { id: 'guacotecti', name: 'Guacotecti' },
      { id: 'ilobasco', name: 'Ilobasco' },
      { id: 'jutiapa', name: 'Jutiapa' },
      { id: 'san-isidro', name: 'San Isidro' },
      { id: 'tejutepeque', name: 'Tejutepeque' },
      { id: 'victoria', name: 'Victoria' }
    ]
  },
  {
    id: 'san-vicente',
    name: 'San Vicente',
    municipalities: [
      { id: 'san-vicente', name: 'San Vicente' },
      { id: 'apastepeque', name: 'Apastepeque' },
      { id: 'guadalupe', name: 'Guadalupe' },
      { id: 'san-cayetano-istepeque', name: 'San Cayetano Istepeque' },
      { id: 'san-esteban-catarina', name: 'San Esteban Catarina' },
      { id: 'san-ildefonso', name: 'San Ildefonso' },
      { id: 'san-lorenzo', name: 'San Lorenzo' },
      { id: 'san-sebastian', name: 'San Sebastián' },
      { id: 'santa-clara', name: 'Santa Clara' },
      { id: 'santo-domingo', name: 'Santo Domingo' },
      { id: 'tecoluca', name: 'Tecoluca' },
      { id: 'tepetitan', name: 'Tepetitán' },
      { id: 'verapaz', name: 'Verapaz' }
    ]
  },
  {
    id: 'usulutan',
    name: 'Usulután',
    municipalities: [
      { id: 'usulutan', name: 'Usulután' },
      { id: 'alegria', name: 'Alegría' },
      { id: 'berlin', name: 'Berlín' },
      { id: 'california', name: 'California' },
      { id: 'concepcion-batres', name: 'Concepción Batres' },
      { id: 'el-triunfo', name: 'El Triunfo' },
      { id: 'ereguayquin', name: 'Ereguayquín' },
      { id: 'estanzuelas', name: 'Estanzuelas' },
      { id: 'jiquilisco', name: 'Jiquilisco' },
      { id: 'jucuapa', name: 'Jucuapa' },
      { id: 'jucuaran', name: 'Jucuarán' },
      { id: 'mercedes-umana', name: 'Mercedes Umaña' },
      { id: 'nueva-granada', name: 'Nueva Granada' },
      { id: 'ozatlan', name: 'Ozatlán' },
      { id: 'puerto-el-triunfo', name: 'Puerto El Triunfo' },
      { id: 'san-agustin', name: 'San Agustín' },
      { id: 'san-buenaventura', name: 'San Buenaventura' },
      { id: 'san-dionisio', name: 'San Dionisio' },
      { id: 'san-francisco-javier', name: 'San Francisco Javier' },
      { id: 'santa-elena', name: 'Santa Elena' },
      { id: 'santa-maria', name: 'Santa María' },
      { id: 'santiago-de-maria', name: 'Santiago de María' },
      { id: 'tecapan', name: 'Tecapán' }
    ]
  },
  {
    id: 'san-miguel',
    name: 'San Miguel',
    municipalities: [
      { id: 'san-miguel', name: 'San Miguel' },
      { id: 'carolina', name: 'Carolina' },
      { id: 'chapeltique', name: 'Chapeltique' },
      { id: 'chinameca', name: 'Chinameca' },
      { id: 'chirilagua', name: 'Chirilagua' },
      { id: 'ciudad-barrios', name: 'Ciudad Barrios' },
      { id: 'comacarán', name: 'Comacarán' },
      { id: 'el-transito', name: 'El Tránsito' },
      { id: 'lolotique', name: 'Lolotique' },
      { id: 'moncagua', name: 'Moncagua' },
      { id: 'nueva-guadalupe', name: 'Nueva Guadalupe' },
      { id: 'quelepa', name: 'Quelepa' },
      { id: 'san-antonio', name: 'San Antonio' },
      { id: 'san-gerardo', name: 'San Gerardo' },
      { id: 'san-jorge', name: 'San Jorge' },
      { id: 'san-luis-de-la-reina', name: 'San Luis de la Reina' },
      { id: 'san-rafael-oriente', name: 'San Rafael Oriente' },
      { id: 'sesori', name: 'Sesori' },
      { id: 'uluazapa', name: 'Uluazapa' }
    ]
  },
  {
    id: 'morazan',
    name: 'Morazán',
    municipalities: [
      { id: 'san-francisco-gotera', name: 'San Francisco Gotera' },
      { id: 'arambala', name: 'Arambala' },
      { id: 'cacaopera', name: 'Cacaopera' },
      { id: 'chilanga', name: 'Chilanga' },
      { id: 'corinto', name: 'Corinto' },
      { id: 'delicias-de-concepcion', name: 'Delicias de Concepción' },
      { id: 'el-divisadero', name: 'El Divisadero' },
      { id: 'el-rosario-morazan', name: 'El Rosario' },
      { id: 'gualococti', name: 'Gualococti' },
      { id: 'guatajiagua', name: 'Guatajiagua' },
      { id: 'joateca', name: 'Joateca' },
      { id: 'jocoaitique', name: 'Jocoaitique' },
      { id: 'jocoro', name: 'Jocoro' },
      { id: 'lolotiquillo', name: 'Lolotiquillo' },
      { id: 'meanguera', name: 'Meanguera' },
      { id: 'osicala', name: 'Osicala' },
      { id: 'perquin', name: 'Perquín' },
      { id: 'san-carlos', name: 'San Carlos' },
      { id: 'san-fernando-morazan', name: 'San Fernando' },
      { id: 'san-isidro-morazan', name: 'San Isidro' },
      { id: 'san-simon', name: 'San Simón' },
      { id: 'sensembra', name: 'Sensembra' },
      { id: 'sociedad', name: 'Sociedad' },
      { id: 'torola', name: 'Torola' },
      { id: 'yamahual', name: 'Yamabal' },
      { id: 'yoloaiquin', name: 'Yoloaiquín' }
    ]
  },
  {
    id: 'la-union',
    name: 'La Unión',
    municipalities: [
      { id: 'la-union', name: 'La Unión' },
      { id: 'anamorós', name: 'Anamorós' },
      { id: 'bolivar', name: 'Bolívar' },
      { id: 'concepcion-de-oriente', name: 'Concepción de Oriente' },
      { id: 'conchagua', name: 'Conchagua' },
      { id: 'el-carmen-la-union', name: 'El Carmen' },
      { id: 'el-sauce', name: 'El Sauce' },
      { id: 'intipuca', name: 'Intipucá' },
      { id: 'lilisque', name: 'Lilisque' },
      { id: 'meanguera-del-golfo', name: 'Meanguera del Golfo' },
      { id: 'nueva-esparta', name: 'Nueva Esparta' },
      { id: 'pasaquina', name: 'Pasaquina' },
      { id: 'polorós', name: 'Polorós' },
      { id: 'san-alejo', name: 'San Alejo' },
      { id: 'san-jose-la-union', name: 'San José' },
      { id: 'santa-rosa-de-lima', name: 'Santa Rosa de Lima' },
      { id: 'yayantique', name: 'Yayantique' },
      { id: 'yucuaiquin', name: 'Yucuaiquín' }
    ]
  }
];
