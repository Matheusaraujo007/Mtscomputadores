
import React, { useState, useMemo } from 'react';
import { useApp } from '../AppContext';
import { CashSession, CashSessionStatus, UserRole } from '../types';
import { useNavigate } from 'react-router-dom';

const CashMovement: React.FC = () => {
  const { cashSessions, establishments, currentUser, saveCashSession, users } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('');
  
  const isAdmin = currentUser?.role === UserRole.ADMIN;
  
  const [showOpeningModal, setShowOpeningModal] = useState(false);
  const [openingValue, setOpeningValue] = useState(0);
  const [selectedRegister, setSelectedRegister] = useState('');

  const currentStore = establishments.find(e => e.id === currentUser?.storeId);

  // Filtra apenas usuários que são CAIXA para servirem como Terminais
  const availableCashiers = useMemo(() => {
    return users.filter(u => u.role === UserRole.CASHIER && (isAdmin || u.storeId === currentUser?.storeId));
  }, [users, isAdmin, currentUser]);

  const filteredSessions = useMemo(() => {
    return cashSessions.filter(s => {
      const belongsToStore = isAdmin || s.storeId === currentUser?.storeId;
      const matchesFilter = filter === '' || 
        s.registerName.toLowerCase().includes(filter.toLowerCase());
      return belongsToStore && matchesFilter;
    });
  }, [cashSessions, filter, isAdmin, currentUser]);

  const handleOpenCash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRegister) { alert('Selecione um terminal de caixa!'); return; }

    const newSession: CashSession = {
      id: `${Date.now()}`,
      storeId: currentUser?.storeId || 'matriz',
      storeName: currentStore?.name || 'Matriz',
      registerName: selectedRegister,
      openingTime: new Date().toLocaleString('pt-BR'),
      openingOperatorId: currentUser?.id,
      openingOperatorName: currentUser?.name,
      openingValue: openingValue,
      status: CashSessionStatus.OPEN,
      priceTable: 'Tabela Padrão' // Mantido internamente mas removido da UI
    };

    await saveCashSession(newSession);
    setShowOpeningModal(false);
    setOpeningValue(0);
    alert('Caixa aberto com sucesso! Redirecionando para o PDV...');
    navigate('/pdv');
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 pb-24">
      
      {/* CABEÇALHO ATUALIZADO */}
      <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Registro de Movimentação Diária do PDV</h2>
          <div className="flex gap-4 mt-2 text-[10px] font-black text-slate-400 uppercase">
             <span>Unidade: {currentStore?.name || 'Carregando...'}</span>
             <span>Ref: {new Date().toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
        <div className="flex gap-2">
           <button className="px-4 py-2 bg-amber-500/10 text-amber-600 rounded-lg text-[10px] font-black uppercase flex items-center gap-2">Relatórios <span className="material-symbols-outlined text-sm">arrow_drop_down</span></button>
           <button onClick={() => setShowOpeningModal(true)} className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase flex items-center gap-2 shadow-lg shadow-emerald-500/20"><span className="material-symbols-outlined text-sm">check_circle</span> Realizar Abertura</button>
           <button className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-500 rounded-lg text-[10px] font-black uppercase flex items-center gap-2">Histórico</button>
           <button className="px-4 py-2 bg-primary text-white rounded-lg text-[10px] font-black uppercase flex items-center gap-2 shadow-lg shadow-primary/20">Arquivos</button>
           <button onClick={() => window.history.back()} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-lg text-[10px] font-black uppercase">Voltar</button>
        </div>
      </div>

      {/* FILTROS RÁPIDOS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
         <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-lg">search</span>
            <input 
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="BUSCAR MOVIMENTAÇÃO PELO NOME DO CAIXA..." 
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg pl-10 text-[10px] font-black uppercase focus:ring-1 focus:ring-primary/20 h-10" 
            />
         </div>
      </div>

      {/* TABELA DE MOVIMENTAÇÕES (COLUNAS REDUZIDAS) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
         <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] font-bold">
               <thead className="bg-primary text-white">
                  <tr>
                     <th className="px-4 py-3 w-10 text-center"><span className="material-symbols-outlined text-sm">settings</span></th>
                     <th className="px-4 py-3">ID</th>
                     <th className="px-4 py-3">Terminal / Operador de Caixa</th>
                     <th className="px-4 py-3">Data/Hora Abertura</th>
                     <th className="px-4 py-3">Data/Hora Fechamento</th>
                     <th className="px-4 py-3">Operador Fechamento</th>
                     <th className="px-4 py-3 text-right">Opções</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSessions.map(session => (
                    <tr key={session.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                       <td className="px-4 py-3 text-center">
                          <span className={`size-2.5 rounded-full inline-block ${session.status === CashSessionStatus.OPEN ? 'bg-emerald-500' : session.status === CashSessionStatus.CLOSED ? 'bg-blue-500' : 'bg-rose-500'}`}></span>
                       </td>
                       <td className="px-4 py-3 font-mono text-slate-400">{session.id}</td>
                       <td className="px-4 py-3 uppercase text-slate-900 dark:text-white">{session.registerName}</td>
                       <td className="px-4 py-3 text-slate-400">{session.openingTime || '--:--'}</td>
                       <td className="px-4 py-3 text-slate-400">{session.closingTime || '--:--'}</td>
                       <td className="px-4 py-3 uppercase text-slate-400">{session.closingOperatorName || '---'}</td>
                       <td className="px-4 py-3 text-right">
                          <button 
                            disabled={session.status === CashSessionStatus.CLOSED}
                            onClick={() => session.status === CashSessionStatus.OPEN ? navigate('/pdv') : null}
                            className="text-primary hover:underline uppercase text-[9px] font-black"
                          >
                            {session.status === CashSessionStatus.OPEN ? 'Acessar PDV' : 'Encerrado'}
                          </button>
                       </td>
                    </tr>
                  ))}
                  {filteredSessions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center opacity-30 font-black uppercase text-[10px] tracking-widest">Nenhuma movimentação para o filtro atual</td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* RODAPÉ DE STATUS */}
      <div className="flex gap-4">
         <div className="bg-white dark:bg-slate-900 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-[9px] font-black uppercase">Registros: {filteredSessions.length}</div>
         <div className="bg-white dark:bg-slate-900 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg flex gap-4 text-[9px] font-black uppercase">
            <span>Legenda:</span>
            <div className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-rose-500"></span> Pendente</div>
            <div className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-500"></span> Operando</div>
            <div className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-blue-500"></span> Finalizado</div>
         </div>
      </div>

      {/* MODAL DE ABERTURA ATUALIZADO */}
      {showOpeningModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
           <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
              <div className="p-6 bg-primary text-white flex justify-between items-center">
                 <h3 className="font-black uppercase tracking-tight">Abertura de Movimento PDV</h3>
                 <button onClick={() => setShowOpeningModal(false)}><span className="material-symbols-outlined">close</span></button>
              </div>
              <form onSubmit={handleOpenCash} className="p-8 space-y-6">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Unidade de Venda</label>
                    <div className="w-full h-12 bg-slate-100 dark:bg-slate-800 rounded-xl px-4 flex items-center text-xs font-black uppercase text-primary border border-primary/10">
                       {currentStore?.name || 'Unidade não identificada'}
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Selecionar Terminal de Caixa</label>
                    <select required value={selectedRegister} onChange={e => setSelectedRegister(e.target.value)} className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 text-xs font-black uppercase">
                       <option value="">Selecione o Operador...</option>
                       {availableCashiers.map((u, idx) => (
                         <option key={u.id} value={`Caixa ${idx + 1} - ${u.name}`}>Caixa {idx + 1} - {u.name}</option>
                       ))}
                       {availableCashiers.length === 0 && <option disabled>Nenhum Operador de Caixa cadastrado</option>}
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Fundo de Troco Inicial (R$)</label>
                    <input autoFocus type="number" step="0.01" required value={openingValue} onChange={e => setOpeningValue(parseFloat(e.target.value) || 0)} className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-6 text-xl font-black text-primary" placeholder="0,00" />
                 </div>
                 <div className="p-4 bg-primary/5 rounded-xl border border-dashed border-primary/20">
                    <p className="text-[10px] font-black uppercase text-primary tracking-widest">Informações de Sessão</p>
                    <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase">Abertura por: {currentUser?.name}</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase">Data: {new Date().toLocaleDateString('pt-BR')}</p>
                 </div>
                 <button type="submit" disabled={availableCashiers.length === 0} className="w-full h-14 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl disabled:opacity-30">Confirmar Abertura</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default CashMovement;
