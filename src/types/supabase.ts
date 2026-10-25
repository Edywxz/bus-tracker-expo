export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      alunos: {
        Row: {
          ativo: boolean | null
          criado_em: string | null
          data_nascimento: string
          documento: string
          endereco_busca: string
          endereco_entrega: string
          foto_url: string | null
          id: string
          instituicao_id: string | null
          nome: string
          observacoes_medicas: string | null
          responsavel_id: string
          transportador_id: string
          turma: string | null
          turno: Database["public"]["Enums"]["turno_enum"]
        }
        Insert: {
          ativo?: boolean | null
          criado_em?: string | null
          data_nascimento: string
          documento: string
          endereco_busca: string
          endereco_entrega: string
          foto_url?: string | null
          id?: string
          instituicao_id?: string | null
          nome: string
          observacoes_medicas?: string | null
          responsavel_id: string
          transportador_id: string
          turma?: string | null
          turno: Database["public"]["Enums"]["turno_enum"]
        }
        Update: {
          ativo?: boolean | null
          criado_em?: string | null
          data_nascimento?: string
          documento?: string
          endereco_busca?: string
          endereco_entrega?: string
          foto_url?: string | null
          id?: string
          instituicao_id?: string | null
          nome?: string
          observacoes_medicas?: string | null
          responsavel_id?: string
          transportador_id?: string
          turma?: string | null
          turno?: Database["public"]["Enums"]["turno_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "alunos_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "instituicoes_ensino"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alunos_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "responsaveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alunos_transportador_id_fkey"
            columns: ["transportador_id"]
            isOneToOne: false
            referencedRelation: "transportadores"
            referencedColumns: ["id"]
          },
        ]
      }
      comunicados_ausencia: {
        Row: {
          aluno_id: string
          data_fim: string
          data_inicio: string
          id: string
          motivo: string | null
          notificado_em: string | null
          periodo: Database["public"]["Enums"]["periodo_ausencia_enum"]
          responsavel_id: string
          transportador_id: string
        }
        Insert: {
          aluno_id: string
          data_fim: string
          data_inicio: string
          id?: string
          motivo?: string | null
          notificado_em?: string | null
          periodo: Database["public"]["Enums"]["periodo_ausencia_enum"]
          responsavel_id: string
          transportador_id: string
        }
        Update: {
          aluno_id?: string
          data_fim?: string
          data_inicio?: string
          id?: string
          motivo?: string | null
          notificado_em?: string | null
          periodo?: Database["public"]["Enums"]["periodo_ausencia_enum"]
          responsavel_id?: string
          transportador_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comunicados_ausencia_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunicados_ausencia_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "responsaveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunicados_ausencia_transportador_id_fkey"
            columns: ["transportador_id"]
            isOneToOne: false
            referencedRelation: "transportadores"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos_servico: {
        Row: {
          aluno_id: string
          criado_em: string | null
          data_inicio: string
          data_termino: string
          dia_vencimento: number
          id: string
          numero_contrato: string
          responsavel_id: string
          status: Database["public"]["Enums"]["status_contrato_enum"] | null
          termos_condicoes: string | null
          transportador_id: string
          valor_mensalidade: number
        }
        Insert: {
          aluno_id: string
          criado_em?: string | null
          data_inicio: string
          data_termino: string
          dia_vencimento: number
          id?: string
          numero_contrato: string
          responsavel_id: string
          status?: Database["public"]["Enums"]["status_contrato_enum"] | null
          termos_condicoes?: string | null
          transportador_id: string
          valor_mensalidade: number
        }
        Update: {
          aluno_id?: string
          criado_em?: string | null
          data_inicio?: string
          data_termino?: string
          dia_vencimento?: number
          id?: string
          numero_contrato?: string
          responsavel_id?: string
          status?: Database["public"]["Enums"]["status_contrato_enum"] | null
          termos_condicoes?: string | null
          transportador_id?: string
          valor_mensalidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "contratos_servico_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_servico_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "responsaveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_servico_transportador_id_fkey"
            columns: ["transportador_id"]
            isOneToOne: false
            referencedRelation: "transportadores"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_rota: {
        Row: {
          data_hora: string | null
          descricao: string
          id: string
          latitude: number | null
          longitude: number | null
          severidade: string | null
          tipo: string
          transportador_id: string
          viagem_id: string
        }
        Insert: {
          data_hora?: string | null
          descricao: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          severidade?: string | null
          tipo: string
          transportador_id: string
          viagem_id: string
        }
        Update: {
          data_hora?: string | null
          descricao?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          severidade?: string | null
          tipo?: string
          transportador_id?: string
          viagem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_rota_transportador_id_fkey"
            columns: ["transportador_id"]
            isOneToOne: false
            referencedRelation: "transportadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_rota_viagem_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      instituicoes_ensino: {
        Row: {
          cnpj: string
          endereco: string
          id: string
          razao_social: string
          telefone_contato: string
        }
        Insert: {
          cnpj: string
          endereco: string
          id: string
          razao_social: string
          telefone_contato: string
        }
        Update: {
          cnpj?: string
          endereco?: string
          id?: string
          razao_social?: string
          telefone_contato?: string
        }
        Relationships: [
          {
            foreignKeyName: "instituicoes_ensino_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      localizacoes_gps: {
        Row: {
          direcao: number | null
          id: string
          posicao: unknown
          precisao_metros: number | null
          timestamp: string | null
          transportador_id: string
          velocidade: number | null
          viagem_id: string
        }
        Insert: {
          direcao?: number | null
          id?: string
          posicao: unknown
          precisao_metros?: number | null
          timestamp?: string | null
          transportador_id: string
          velocidade?: number | null
          viagem_id: string
        }
        Update: {
          direcao?: number | null
          id?: string
          posicao?: unknown
          precisao_metros?: number | null
          timestamp?: string | null
          transportador_id?: string
          velocidade?: number | null
          viagem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "localizacoes_gps_transportador_id_fkey"
            columns: ["transportador_id"]
            isOneToOne: false
            referencedRelation: "transportadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "localizacoes_gps_viagem_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      mensalidades: {
        Row: {
          ano_referencia: number
          contrato_id: string
          criado_em: string | null
          data_vencimento: string
          id: string
          mes_referencia: number
          responsavel_id: string
          status: Database["public"]["Enums"]["status_mensalidade_enum"] | null
          transportador_id: string
          valor: number
          valor_multa_juros: number | null
        }
        Insert: {
          ano_referencia: number
          contrato_id: string
          criado_em?: string | null
          data_vencimento: string
          id?: string
          mes_referencia: number
          responsavel_id: string
          status?: Database["public"]["Enums"]["status_mensalidade_enum"] | null
          transportador_id: string
          valor: number
          valor_multa_juros?: number | null
        }
        Update: {
          ano_referencia?: number
          contrato_id?: string
          criado_em?: string | null
          data_vencimento?: string
          id?: string
          mes_referencia?: number
          responsavel_id?: string
          status?: Database["public"]["Enums"]["status_mensalidade_enum"] | null
          transportador_id?: string
          valor?: number
          valor_multa_juros?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mensalidades_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensalidades_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "responsaveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensalidades_transportador_id_fkey"
            columns: ["transportador_id"]
            isOneToOne: false
            referencedRelation: "transportadores"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          data_pagamento: string | null
          detalhes_metodo: Json | null
          id: string
          mensalidade_id: string
          metodo: Database["public"]["Enums"]["metodo_pagamento_enum"]
          status: string | null
          transacao_id: string | null
          valor_pago: number
        }
        Insert: {
          data_pagamento?: string | null
          detalhes_metodo?: Json | null
          id?: string
          mensalidade_id: string
          metodo: Database["public"]["Enums"]["metodo_pagamento_enum"]
          status?: string | null
          transacao_id?: string | null
          valor_pago: number
        }
        Update: {
          data_pagamento?: string | null
          detalhes_metodo?: Json | null
          id?: string
          mensalidade_id?: string
          metodo?: Database["public"]["Enums"]["metodo_pagamento_enum"]
          status?: string | null
          transacao_id?: string | null
          valor_pago?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_mensalidade_id_fkey"
            columns: ["mensalidade_id"]
            isOneToOne: false
            referencedRelation: "mensalidades"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          cpf: string
          criado_em: string | null
          email: string
          id: string
          nome: string
          telefone: string
          tipo_usuario: Database["public"]["Enums"]["tipo_usuario_enum"]
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          cpf: string
          criado_em?: string | null
          email: string
          id: string
          nome: string
          telefone: string
          tipo_usuario: Database["public"]["Enums"]["tipo_usuario_enum"]
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          cpf?: string
          criado_em?: string | null
          email?: string
          id?: string
          nome?: string
          telefone?: string
          tipo_usuario?: Database["public"]["Enums"]["tipo_usuario_enum"]
        }
        Relationships: []
      }
      pessoas_autorizadas: {
        Row: {
          aluno_id: string
          ativo: boolean | null
          cpf: string
          criado_em: string | null
          foto_url: string | null
          grau_parentesco: string
          id: string
          nome: string
          telefone: string
        }
        Insert: {
          aluno_id: string
          ativo?: boolean | null
          cpf: string
          criado_em?: string | null
          foto_url?: string | null
          grau_parentesco: string
          id?: string
          nome: string
          telefone: string
        }
        Update: {
          aluno_id?: string
          ativo?: boolean | null
          cpf?: string
          criado_em?: string | null
          foto_url?: string | null
          grau_parentesco?: string
          id?: string
          nome?: string
          telefone?: string
        }
        Relationships: [
          {
            foreignKeyName: "pessoas_autorizadas_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
        ]
      }
      registros_embarque_desembarque: {
        Row: {
          aluno_id: string
          data_hora: string | null
          id: string
          latitude: number | null
          longitude: number | null
          registrado_offline: boolean | null
          sincronizado_em: string | null
          tipo: Database["public"]["Enums"]["tipo_embarque_enum"]
          viagem_id: string
        }
        Insert: {
          aluno_id: string
          data_hora?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          registrado_offline?: boolean | null
          sincronizado_em?: string | null
          tipo: Database["public"]["Enums"]["tipo_embarque_enum"]
          viagem_id: string
        }
        Update: {
          aluno_id?: string
          data_hora?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          registrado_offline?: boolean | null
          sincronizado_em?: string | null
          tipo?: Database["public"]["Enums"]["tipo_embarque_enum"]
          viagem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registros_embarque_desembarque_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_embarque_desembarque_viagem_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      responsaveis: {
        Row: {
          endereco_residencial: string
          id: string
        }
        Insert: {
          endereco_residencial: string
          id: string
        }
        Update: {
          endereco_residencial?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "responsaveis_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      transportadores: {
        Row: {
          alvara_autonomo: string
          categoria_cnh: string
          cnh: string
          foto_url: string | null
          id: string
          numero_credencial: string | null
        }
        Insert: {
          alvara_autonomo: string
          categoria_cnh: string
          cnh: string
          foto_url?: string | null
          id: string
          numero_credencial?: string | null
        }
        Update: {
          alvara_autonomo?: string
          categoria_cnh?: string
          cnh?: string
          foto_url?: string | null
          id?: string
          numero_credencial?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transportadores_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      veiculos: {
        Row: {
          ano: number
          ativo: boolean | null
          capacidade_assentos: number
          criado_em: string | null
          id: string
          modelo: string
          numero_alvara: string
          placa: string
          renavam: string
          transportador_id: string
          validade_vistoria: string
        }
        Insert: {
          ano: number
          ativo?: boolean | null
          capacidade_assentos: number
          criado_em?: string | null
          id?: string
          modelo: string
          numero_alvara: string
          placa: string
          renavam: string
          transportador_id: string
          validade_vistoria: string
        }
        Update: {
          ano?: number
          ativo?: boolean | null
          capacidade_assentos?: number
          criado_em?: string | null
          id?: string
          modelo?: string
          numero_alvara?: string
          placa?: string
          renavam?: string
          transportador_id?: string
          validade_vistoria?: string
        }
        Relationships: [
          {
            foreignKeyName: "veiculos_transportador_id_fkey"
            columns: ["transportador_id"]
            isOneToOne: false
            referencedRelation: "transportadores"
            referencedColumns: ["id"]
          },
        ]
      }
      viagens: {
        Row: {
          criado_em: string | null
          data_hora_fim: string | null
          data_hora_inicio: string | null
          id: string
          km_percorrido: number | null
          status: Database["public"]["Enums"]["status_viagem_enum"] | null
          tipo_viagem: Database["public"]["Enums"]["tipo_viagem_enum"]
          transportador_id: string
          turno: Database["public"]["Enums"]["turno_enum"]
          veiculo_id: string
        }
        Insert: {
          criado_em?: string | null
          data_hora_fim?: string | null
          data_hora_inicio?: string | null
          id?: string
          km_percorrido?: number | null
          status?: Database["public"]["Enums"]["status_viagem_enum"] | null
          tipo_viagem: Database["public"]["Enums"]["tipo_viagem_enum"]
          transportador_id: string
          turno: Database["public"]["Enums"]["turno_enum"]
          veiculo_id: string
        }
        Update: {
          criado_em?: string | null
          data_hora_fim?: string | null
          data_hora_inicio?: string | null
          id?: string
          km_percorrido?: number | null
          status?: Database["public"]["Enums"]["status_viagem_enum"] | null
          tipo_viagem?: Database["public"]["Enums"]["tipo_viagem_enum"]
          transportador_id?: string
          turno?: Database["public"]["Enums"]["turno_enum"]
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "viagens_transportador_id_fkey"
            columns: ["transportador_id"]
            isOneToOne: false
            referencedRelation: "transportadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viagens_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      gettransactionid: { Args: never; Returns: unknown }
      longtransactionsenabled: { Args: never; Returns: boolean }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      unlockrows: { Args: { "": string }; Returns: number }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
    }
    Enums: {
      metodo_pagamento_enum: "PIX" | "CARTAO" | "BOLETO"
      periodo_ausencia_enum: "IDA" | "VOLTA" | "AMBOS"
      status_contrato_enum: "ATIVO" | "SUSPENSO" | "CANCELADO" | "ENCERRADO"
      status_mensalidade_enum: "PENDENTE" | "PAGO" | "VENCIDO" | "CANCELADO"
      status_viagem_enum:
        | "AGENDADA"
        | "EM_ANDAMENTO"
        | "CONCLUIDA"
        | "CANCELADA"
      tipo_embarque_enum: "EMBARQUE" | "DESEMBARQUE"
      tipo_usuario_enum: "RESPONSAVEL" | "TRANSPORTADOR" | "INSTITUICAO"
      tipo_viagem_enum: "IDA" | "VOLTA"
      turno_enum: "MANHA" | "TARDE" | "INTEGRAL" | "NOITE"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      metodo_pagamento_enum: ["PIX", "CARTAO", "BOLETO"],
      periodo_ausencia_enum: ["IDA", "VOLTA", "AMBOS"],
      status_contrato_enum: ["ATIVO", "SUSPENSO", "CANCELADO", "ENCERRADO"],
      status_mensalidade_enum: ["PENDENTE", "PAGO", "VENCIDO", "CANCELADO"],
      status_viagem_enum: [
        "AGENDADA",
        "EM_ANDAMENTO",
        "CONCLUIDA",
        "CANCELADA",
      ],
      tipo_embarque_enum: ["EMBARQUE", "DESEMBARQUE"],
      tipo_usuario_enum: ["RESPONSAVEL", "TRANSPORTADOR", "INSTITUICAO"],
      tipo_viagem_enum: ["IDA", "VOLTA"],
      turno_enum: ["MANHA", "TARDE", "INTEGRAL", "NOITE"],
    },
  },
} as const
