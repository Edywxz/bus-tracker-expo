// GERADO por scripts/gerar-rota-demo.js — não edite à mão. Dados © colaboradores do OpenStreetMap (ODbL).
// Endereços reais de São Paulo e a rota mais eficiente (ida) por todas as paradas, seguindo as ruas.
export const DEMO_LUGARES = {
  "garagem": {
    "rotulo": "Garagem do motorista",
    "endereco": "500, Rua Joaquim Floriano",
    "latitude": -23.5846517,
    "longitude": -46.6748278
  },
  "lucas": {
    "rotulo": "Lucas Silva",
    "endereco": "595, Rua Haddock Lobo",
    "latitude": -23.5580209,
    "longitude": -46.6616788
  },
  "beatriz": {
    "rotulo": "Beatriz Santos",
    "endereco": "450, Avenida Brasil",
    "latitude": -23.5759434,
    "longitude": -46.6647074
  },
  "gabriel": {
    "rotulo": "Gabriel Costa",
    "endereco": "980, Rua Augusta",
    "latitude": -23.5532576,
    "longitude": -46.6551046
  },
  "sofia": {
    "rotulo": "Sofia Lima",
    "endereco": "1500, Rua Estados Unidos",
    "latitude": -23.5668093,
    "longitude": -46.6687497
  },
  "ana": {
    "rotulo": "Ana Silva",
    "endereco": "Avenida Paulista, 1578",
    "latitude": -23.5616836,
    "longitude": -46.6565685
  },
  "santaMaria": {
    "rotulo": "Colégio Santa Maria",
    "endereco": "1000, Alameda Santos",
    "latitude": -23.5661834,
    "longitude": -46.6526312
  },
  "aurora": {
    "rotulo": "Escola Municipal Aurora",
    "endereco": "800, Alameda Campinas",
    "latitude": -23.5678556,
    "longitude": -46.6552623
  }
} as const;

export const DEMO_ROTA = {
  km: 10,
  minutos: 19,
  /** ordem de visita: garagem, depois estas paradas */
  ordem: ["beatriz","sofia","gabriel","lucas","ana","santaMaria","aurora"],
  /** índice em `pontos` onde a van fica ao chegar em cada parada */
  paradas: [{"id":"beatriz","indice":25},{"id":"sofia","indice":42},{"id":"gabriel","indice":77},{"id":"lucas","indice":88},{"id":"ana","indice":97},{"id":"santaMaria","indice":105},{"id":"aurora","indice":113}],
  pontos: [{"latitude":-23.584642,"longitude":-46.674831,"rua":"Rua Joaquim Floriano"},{"latitude":-23.584821,"longitude":-46.675503,"rua":"Rua Joaquim Floriano"},{"latitude":-23.584076,"longitude":-46.675815,"rua":"Rua Bandeira Paulista"},{"latitude":-23.583197,"longitude":-46.676093,"rua":"Rua Bandeira Paulista"},{"latitude":-23.582672,"longitude":-46.674168,"rua":"Rua Tabapuã"},{"latitude":-23.582233,"longitude":-46.672558,"rua":"Rua Tabapuã"},{"latitude":-23.581919,"longitude":-46.671407,"rua":"Rua Tabapuã"},{"latitude":-23.581711,"longitude":-46.670643,"rua":"Rua Tabapuã"},{"latitude":-23.582259,"longitude":-46.67046,"rua":"Avenida São Gabriel"},{"latitude":-23.582897,"longitude":-46.670343,"rua":"Avenida São Gabriel"},{"latitude":-23.58277,"longitude":-46.669741,"rua":"Rua General Mena Barreto"},{"latitude":-23.582418,"longitude":-46.66923,"rua":"Rua General Mena Barreto"},{"latitude":-23.582086,"longitude":-46.668748,"rua":"Rua General Mena Barreto"},{"latitude":-23.581629,"longitude":-46.668086,"rua":"Rua General Mena Barreto"},{"latitude":-23.581207,"longitude":-46.667464,"rua":"Rua General Mena Barreto"},{"latitude":-23.580816,"longitude":-46.666904,"rua":"Rua General Mena Barreto"},{"latitude":-23.580468,"longitude":-46.66638,"rua":"Rua General Mena Barreto"},{"latitude":-23.580162,"longitude":-46.665874,"rua":"Rua General Mena Barreto"},{"latitude":-23.579713,"longitude":-46.665141,"rua":"Rua General Mena Barreto"},{"latitude":-23.579259,"longitude":-46.664404,"rua":"Rua General Mena Barreto"},{"latitude":-23.57876,"longitude":-46.66366,"rua":"Rua General Mena Barreto"},{"latitude":-23.578088,"longitude":-46.66416,"rua":"Rua Marechal Bitencourt"},{"latitude":-23.57768,"longitude":-46.664609,"rua":"Rua Marechal Bitencourt"},{"latitude":-23.577309,"longitude":-46.664092,"rua":"Rua Veneza"},{"latitude":-23.576397,"longitude":-46.664451,"rua":"Avenida Brasil"},{"latitude":-23.576048,"longitude":-46.664824,"rua":"Avenida Brasil"},{"latitude":-23.575594,"longitude":-46.66531,"rua":"Avenida Brasil"},{"latitude":-23.575108,"longitude":-46.665825,"rua":"Avenida Brasil"},{"latitude":-23.574582,"longitude":-46.666383,"rua":"Avenida Brasil"},{"latitude":-23.574067,"longitude":-46.666929,"rua":"Avenida Brasil"},{"latitude":-23.573628,"longitude":-46.667389,"rua":"Avenida Brasil"},{"latitude":-23.572962,"longitude":-46.668091,"rua":"Avenida Brasil"},{"latitude":-23.572029,"longitude":-46.669085,"rua":"Avenida Brasil"},{"latitude":-23.571442,"longitude":-46.668849,"rua":"Rua Argentina"},{"latitude":-23.570703,"longitude":-46.6687,"rua":"Rua Argentina"},{"latitude":-23.570141,"longitude":-46.668385,"rua":"Rua Argentina"},{"latitude":-23.569749,"longitude":-46.667973,"rua":"Rua Argentina"},{"latitude":-23.569215,"longitude":-46.667426,"rua":"Rua Argentina"},{"latitude":-23.568492,"longitude":-46.666671,"rua":"Rua Argentina"},{"latitude":-23.567958,"longitude":-46.667323,"rua":"Rua Estados Unidos"},{"latitude":-23.567408,"longitude":-46.667972,"rua":"Rua Estados Unidos"},{"latitude":-23.567034,"longitude":-46.668446,"rua":"Rua Estados Unidos"},{"latitude":-23.5668,"longitude":-46.668742,"rua":"Rua Estados Unidos"},{"latitude":-23.566121,"longitude":-46.66857,"rua":"Rua Augusta"},{"latitude":-23.565659,"longitude":-46.668096,"rua":"Rua Augusta"},{"latitude":-23.565155,"longitude":-46.667556,"rua":"Rua Augusta"},{"latitude":-23.564753,"longitude":-46.667137,"rua":"Rua Augusta"},{"latitude":-23.56429,"longitude":-46.666655,"rua":"Rua Augusta"},{"latitude":-23.563814,"longitude":-46.666159,"rua":"Rua Augusta"},{"latitude":-23.563133,"longitude":-46.665461,"rua":"Rua Augusta"},{"latitude":-23.562698,"longitude":-46.664995,"rua":"Rua Augusta"},{"latitude":-23.56228,"longitude":-46.664563,"rua":"Rua Augusta"},{"latitude":-23.561725,"longitude":-46.663992,"rua":"Rua Augusta"},{"latitude":-23.561242,"longitude":-46.663485,"rua":"Rua Augusta"},{"latitude":-23.560851,"longitude":-46.663076,"rua":"Rua Augusta"},{"latitude":-23.560227,"longitude":-46.662416,"rua":"Rua Augusta"},{"latitude":-23.559829,"longitude":-46.661997,"rua":"Rua Augusta"},{"latitude":-23.559097,"longitude":-46.661235,"rua":"Rua Augusta"},{"latitude":-23.558633,"longitude":-46.660739,"rua":"Rua Augusta"},{"latitude":-23.558175,"longitude":-46.660259,"rua":"Rua Augusta"},{"latitude":-23.557456,"longitude":-46.659506,"rua":"Rua Augusta"},{"latitude":-23.557057,"longitude":-46.659087,"rua":"Rua Augusta"},{"latitude":-23.556348,"longitude":-46.658341,"rua":"Rua Augusta"},{"latitude":-23.555624,"longitude":-46.65757,"rua":"Rua Augusta"},{"latitude":-23.554932,"longitude":-46.656834,"rua":"Rua Augusta"},{"latitude":-23.554538,"longitude":-46.656391,"rua":"Rua Augusta"},{"latitude":-23.554073,"longitude":-46.65589,"rua":"Rua Augusta"},{"latitude":-23.553475,"longitude":-46.655286,"rua":"Rua Augusta"},{"latitude":-23.552726,"longitude":-46.655723,"rua":"Rua Costa"},{"latitude":-23.552015,"longitude":-46.654821,"rua":"Rua Bela Cintra"},{"latitude":-23.551325,"longitude":-46.653953,"rua":"Rua Bela Cintra"},{"latitude":-23.550808,"longitude":-46.653305,"rua":"Rua Bela Cintra"},{"latitude":-23.551297,"longitude":-46.652933,"rua":"Rua Dona Antônia de Queirós"},{"latitude":-23.551824,"longitude":-46.652693,"rua":"Rua Dona Antônia de Queirós"},{"latitude":-23.552404,"longitude":-46.653362,"rua":"Rua Augusta"},{"latitude":-23.552714,"longitude":-46.653912,"rua":"Rua Augusta"},{"latitude":-23.55301,"longitude":-46.654454,"rua":"Rua Augusta"},{"latitude":-23.553317,"longitude":-46.65507,"rua":"Rua Augusta"},{"latitude":-23.553827,"longitude":-46.655633,"rua":"Rua Augusta"},{"latitude":-23.554538,"longitude":-46.656391,"rua":"Rua Augusta"},{"latitude":-23.554932,"longitude":-46.656834,"rua":"Rua Augusta"},{"latitude":-23.555413,"longitude":-46.657346,"rua":"Rua Augusta"},{"latitude":-23.556181,"longitude":-46.658164,"rua":"Rua Augusta"},{"latitude":-23.555593,"longitude":-46.659008,"rua":"Rua Antônio Carlos"},{"latitude":-23.556102,"longitude":-46.659737,"rua":"Rua Haddock Lobo"},{"latitude":-23.556558,"longitude":-46.660233,"rua":"Rua Haddock Lobo"},{"latitude":-23.557061,"longitude":-46.660781,"rua":"Rua Haddock Lobo"},{"latitude":-23.557521,"longitude":-46.661271,"rua":"Rua Haddock Lobo"},{"latitude":-23.557967,"longitude":-46.66174,"rua":"Rua Haddock Lobo"},{"latitude":-23.558735,"longitude":-46.661504,"rua":"Alameda Santos"},{"latitude":-23.559244,"longitude":-46.660932,"rua":"Alameda Santos"},{"latitude":-23.559827,"longitude":-46.66027,"rua":"Alameda Santos"},{"latitude":-23.560373,"longitude":-46.659652,"rua":"Alameda Santos"},{"latitude":-23.560898,"longitude":-46.659055,"rua":"Alameda Santos"},{"latitude":-23.560189,"longitude":-46.65816,"rua":"Alameda Ministro Rocha Azevedo"},{"latitude":-23.560762,"longitude":-46.657355,"rua":"Avenida Paulista"},{"latitude":-23.561216,"longitude":-46.656837,"rua":"Avenida Paulista"},{"latitude":-23.561571,"longitude":-46.656446,"rua":"Avenida Paulista"},{"latitude":-23.562072,"longitude":-46.655882,"rua":"Avenida Paulista"},{"latitude":-23.56284,"longitude":-46.654936,"rua":"Avenida Paulista"},{"latitude":-23.563564,"longitude":-46.654055,"rua":"Avenida Paulista"},{"latitude":-23.56457,"longitude":-46.654615,"rua":"Rua Pamplona"},{"latitude":-23.565186,"longitude":-46.654035,"rua":"Alameda Santos"},{"latitude":-23.565783,"longitude":-46.653316,"rua":"Alameda Santos"},{"latitude":-23.566258,"longitude":-46.652735,"rua":"Alameda Santos"},{"latitude":-23.566272,"longitude":-46.652719,"rua":"Alameda Santos"},{"latitude":-23.566691,"longitude":-46.652211,"rua":"Alameda Santos"},{"latitude":-23.567073,"longitude":-46.65175,"rua":"Alameda Santos"},{"latitude":-23.567863,"longitude":-46.652546,"rua":"Alameda Joaquim Eugênio de Lima"},{"latitude":-23.568526,"longitude":-46.653206,"rua":"Alameda Joaquim Eugênio de Lima"},{"latitude":-23.569371,"longitude":-46.654046,"rua":"Alameda Joaquim Eugênio de Lima"},{"latitude":-23.568967,"longitude":-46.654873,"rua":"Alameda Sarutaiá"},{"latitude":-23.568446,"longitude":-46.655554,"rua":"Alameda Sarutaiá"},{"latitude":-23.567914,"longitude":-46.655191,"rua":"Alameda Campinas"}],
} as const;
