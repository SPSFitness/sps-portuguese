-- Starter vocabulary. European Portuguese forms only.
-- phonetic uses a plain English respelling: CAPS = stressed syllable,
-- ' = swallowed vowel, sh = the EP final s.

insert into vocab (pt, en, pos, gender, phonetic, cefr, topic, example_pt, example_en, br_warning) values
-- greetings and survival
('olá', 'hello', 'phrase', null, 'o-LAH', 'A1', 'daily', 'Olá, tudo bem?', 'Hello, all good?', null),
('bom dia', 'good morning', 'phrase', null, 'bong DEE-uh', 'A1', 'daily', 'Bom dia, faz favor.', 'Good morning, please.', null),
('boa tarde', 'good afternoon', 'phrase', null, 'BO-uh TARD', 'A1', 'daily', 'Boa tarde a todos.', 'Good afternoon everyone.', null),
('se faz favor', 'please', 'phrase', null, 'sf''sh fuh-VOR', 'A1', 'daily', 'Um café, se faz favor.', 'A coffee, please.', 'Brazilians say por favor. Both work in Portugal but se faz favor is the local default.'),
('obrigado', 'thank you (said by a man)', 'phrase', 'm', 'o-bri-GAH-du', 'A1', 'daily', 'Obrigado pela ajuda.', 'Thanks for the help.', null),
('desculpe', 'sorry, excuse me', 'phrase', null, 'd''sh-KULP', 'A1', 'daily', 'Desculpe, pode repetir?', 'Sorry, can you repeat?', null),
('pois', 'right, indeed', 'phrase', null, 'poysh', 'A2', 'daily', 'Pois, tens razão.', 'Right, you are correct.', 'Very Portuguese filler. Rare in Brazil.'),
('fixe', 'cool, great', 'adj', null, 'feesh', 'A2', 'daily', 'Isso é fixe.', 'That is great.', 'Brazilians say legal.'),

-- the vocabulary split that marks you out immediately
('pequeno-almoço', 'breakfast', 'noun', 'm', 'p''KEH-nu al-MO-su', 'A1', 'daily', 'Tomo o pequeno-almoço às sete.', 'I have breakfast at seven.', 'Brazilians say café da manhã.'),
('comboio', 'train', 'noun', 'm', 'kom-BOY-u', 'A1', 'daily', 'Apanhei o comboio para o Porto.', 'I caught the train to Porto.', 'Brazilians say trem.'),
('autocarro', 'bus', 'noun', 'm', 'ow-tu-KAH-rru', 'A1', 'daily', 'O autocarro está atrasado.', 'The bus is late.', 'Brazilians say ônibus.'),
('casa de banho', 'bathroom', 'noun', 'f', 'KAH-zuh d''BAH-nyu', 'A1', 'daily', 'Onde fica a casa de banho?', 'Where is the bathroom?', 'Brazilians say banheiro.'),
('telemóvel', 'mobile phone', 'noun', 'm', 't''l''-MO-vel', 'A1', 'daily', 'Esqueci-me do telemóvel.', 'I forgot my phone.', 'Brazilians say celular.'),
('frigorífico', 'fridge', 'noun', 'm', 'fri-gu-REE-fi-ku', 'A1', 'daily', 'Está no frigorífico.', 'It is in the fridge.', 'Brazilians say geladeira.'),
('sumo', 'juice', 'noun', 'm', 'SOO-mu', 'A1', 'daily', 'Um sumo de laranja.', 'An orange juice.', 'Brazilians say suco.'),
('gelado', 'ice cream', 'noun', 'm', 'j''-LAH-du', 'A1', 'daily', 'Queres um gelado?', 'Do you want an ice cream?', 'Brazilians say sorvete.'),
('talho', 'butcher shop', 'noun', 'm', 'TAH-lyu', 'A2', 'daily', 'Vou ao talho.', 'I am going to the butcher.', 'Brazilians say açougue.'),
('bica', 'espresso (Lisbon)', 'noun', 'f', 'BEE-kuh', 'A2', 'daily', 'Uma bica, faz favor.', 'An espresso, please.', null),
('miúdo', 'kid', 'noun', 'm', 'mee-OO-du', 'A2', 'daily', 'Os miúdos estão no parque.', 'The kids are in the park.', null),
('rapaz', 'lad, young man', 'noun', 'm', 'rruh-PASH', 'A1', 'daily', 'Aquele rapaz treina aqui.', 'That lad trains here.', null),
('morada', 'address', 'noun', 'f', 'mu-RAH-duh', 'A2', 'admin', 'Qual é a sua morada?', 'What is your address?', 'Brazilians say endereço.'),
('peão', 'pedestrian', 'noun', 'm', 'p''-OWNG', 'B1', 'daily', 'Passadeira para peões.', 'Pedestrian crossing.', 'Brazilians say pedestre.'),

-- numbers where the two standards split
('dezasseis', 'sixteen', 'num', null, 'd''-zuh-SAYSH', 'A1', 'daily', 'Tenho dezasseis.', 'I have sixteen.', 'Brazilians write dezesseis.'),
('dezassete', 'seventeen', 'num', null, 'd''-zuh-SET', 'A1', 'daily', 'São dezassete euros.', 'That is seventeen euros.', 'Brazilians write dezessete.'),
('dezanove', 'nineteen', 'num', null, 'd''-zuh-NOV', 'A1', 'daily', 'Dezanove pessoas.', 'Nineteen people.', 'Brazilians write dezenove.'),

-- core verbs
('ser', 'to be (permanent)', 'verb', null, 'sehr', 'A1', 'grammar', 'Sou treinador.', 'I am a coach.', null),
('estar', 'to be (state, location)', 'verb', null, '''sh-TAR', 'A1', 'grammar', 'Estou no ginásio.', 'I am at the gym.', null),
('ter', 'to have', 'verb', null, 'tehr', 'A1', 'grammar', 'Tenho uma aula às seis.', 'I have a class at six.', null),
('ir', 'to go', 'verb', null, 'eer', 'A1', 'grammar', 'Vou a Lisboa.', 'I am going to Lisbon.', null),
('fazer', 'to do, to make', 'verb', null, 'fuh-ZEHR', 'A1', 'grammar', 'Faço treino todos os dias.', 'I train every day.', null),
('poder', 'to be able to', 'verb', null, 'pu-DEHR', 'A1', 'grammar', 'Pode ajudar-me?', 'Can you help me?', null),
('querer', 'to want', 'verb', null, 'k''-REHR', 'A1', 'grammar', 'Quero aprender português.', 'I want to learn Portuguese.', null),
('saber', 'to know (facts)', 'verb', null, 'suh-BEHR', 'A2', 'grammar', 'Não sei ainda.', 'I do not know yet.', null),
('conhecer', 'to know (people, places)', 'verb', null, 'ku-ny''-SEHR', 'A2', 'grammar', 'Conheço o Porto.', 'I know Porto.', null),
('ficar', 'to stay, to become, to be located', 'verb', null, 'fi-KAR', 'A2', 'grammar', 'Onde fica o ginásio?', 'Where is the gym?', null),
('apanhar', 'to catch, to pick up', 'verb', null, 'uh-puh-NYAR', 'A2', 'grammar', 'Apanho o autocarro.', 'I catch the bus.', 'Brazilians prefer pegar.'),

-- the construction that gives you away
('estar a + infinitivo', 'to be doing something', 'phrase', null, '''sh-TAR uh', 'A1', 'grammar', 'Estou a falar contigo.', 'I am talking to you.', 'Brazilians say estou falando. Never use the gerund this way in Portugal.'),

-- gym and coaching
('ginásio', 'gym', 'noun', 'm', 'ji-NAH-zyu', 'A1', 'gym', 'Trabalho num ginásio.', 'I work in a gym.', null),
('treino', 'training session, workout', 'noun', 'm', 'TRAY-nu', 'A1', 'gym', 'O treino começa às seis.', 'The session starts at six.', null),
('treinador', 'coach, trainer', 'noun', 'm', 'tray-nuh-DOR', 'A1', 'gym', 'Sou treinador pessoal.', 'I am a personal trainer.', null),
('agachamento', 'squat', 'noun', 'm', 'uh-guh-shuh-MEN-tu', 'A2', 'gym', 'Vinte agachamentos.', 'Twenty squats.', null),
('flexão', 'press-up', 'noun', 'f', 'fl''-SOWNG', 'A2', 'gym', 'Dez flexões.', 'Ten press-ups.', null),
('repetição', 'repetition, rep', 'noun', 'f', 'rr''-p''-ti-SOWNG', 'A2', 'gym', 'Mais cinco repetições.', 'Five more reps.', null),
('alongamento', 'stretch', 'noun', 'm', 'uh-long-guh-MEN-tu', 'A2', 'gym', 'Vamos fazer alongamentos.', 'Let us stretch.', null),
('descansar', 'to rest', 'verb', null, 'd''sh-kan-SAR', 'A1', 'gym', 'Descansa trinta segundos.', 'Rest thirty seconds.', null),
('respirar', 'to breathe', 'verb', null, 'rr''sh-pi-RAR', 'A1', 'gym', 'Respira fundo.', 'Breathe deeply.', null),
('levantar', 'to lift', 'verb', null, 'l''-van-TAR', 'A1', 'gym', 'Levanta os braços.', 'Raise your arms.', null),
('balneário', 'changing room', 'noun', 'm', 'bal-NYAH-ryu', 'A2', 'gym', 'Os balneários ficam ali.', 'The changing rooms are over there.', null),

-- football
('equipa', 'team', 'noun', 'f', '''KEE-puh', 'A1', 'football', 'A minha equipa joga sábado.', 'My team plays Saturday.', 'Brazilians say equipe.'),
('relvado', 'pitch', 'noun', 'm', 'rrel-VAH-du', 'A2', 'football', 'O relvado está molhado.', 'The pitch is wet.', 'Brazilians say gramado.'),
('guarda-redes', 'goalkeeper', 'noun', 'm', 'GWAR-duh-RREH-d''sh', 'A2', 'football', 'É o nosso guarda-redes.', 'He is our goalkeeper.', 'Brazilians say goleiro.'),
('baliza', 'goal (the posts)', 'noun', 'f', 'buh-LEE-zuh', 'A2', 'football', 'Remata à baliza.', 'Shoot at goal.', 'Brazilians say gol or trave.'),
('pontapé', 'kick', 'noun', 'm', 'pon-tuh-PEH', 'A2', 'football', 'Pontapé de canto.', 'Corner kick.', 'Brazilians say chute.'),

-- admin, property, the words you will actually need
('câmara municipal', 'town council', 'noun', 'f', 'KAH-muh-ruh mu-ni-si-PAL', 'B1', 'admin', 'Vou à câmara municipal.', 'I am going to the council.', null),
('Finanças', 'the tax office', 'noun', 'f', 'fi-NAN-suhsh', 'B1', 'admin', 'Tenho de ir às Finanças.', 'I have to go to the tax office.', null),
('NIF', 'tax number', 'noun', 'm', 'neef', 'A2', 'admin', 'Precisa do NIF?', 'Do you need the tax number?', null),
('licença', 'licence, permit', 'noun', 'f', 'li-SEN-suh', 'B1', 'admin', 'A licença de utilização.', 'The occupancy permit.', null),
('fatura', 'invoice, receipt', 'noun', 'f', 'fuh-TOO-ruh', 'A2', 'admin', 'Quer fatura com contribuinte?', 'Do you want a receipt with your tax number?', null),
('empreiteiro', 'building contractor', 'noun', 'm', 'eng-pray-TAY-ru', 'B1', 'property', 'Falei com o empreiteiro.', 'I spoke to the contractor.', null),
('obra', 'building works', 'noun', 'f', 'O-bruh', 'B1', 'property', 'A obra começa em Maio.', 'The works start in May.', null),
('escritura', 'deed of sale', 'noun', 'f', '''sh-kri-TOO-ruh', 'B2', 'property', 'A escritura é na quinta.', 'The deed signing is Thursday.', null),
('imóvel', 'property', 'noun', 'm', 'ee-MO-vel', 'B1', 'property', 'Comprámos um imóvel.', 'We bought a property.', null),
('arrendar', 'to rent out', 'verb', null, 'uh-rren-DAR', 'B1', 'property', 'Quero arrendar a casa.', 'I want to rent out the house.', 'Brazilians say alugar.'),
('quinta', 'country estate, farm', 'noun', 'f', 'KEEN-tuh', 'A2', 'property', 'Uma quinta no Alentejo.', 'An estate in the Alentejo.', null)
on conflict (pt, en) do nothing;
